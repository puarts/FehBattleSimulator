if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    __applySpursFromAllies(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方からのバフ').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    },

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @private
     */
    __applySpursFromEnemies(targetUnit, enemyUnit, damageCalcEnv) {
        let disablesSkillsFromEnemyAlliesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
                disablesSkillsFromEnemyAlliesInCombat = true;
            }
        }
        // enemyAllyにはenemyUnitも含まれる
        for (let enemyAlly of this.enumerateUnitsInTheSameGroupOnMap(enemyUnit, true)) {
            let isEnemyAllyNotEnemy = enemyAlly !== enemyUnit;
            if (disablesSkillsFromEnemyAlliesInCombat && isEnemyAllyNotEnemy) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, enemyAlly)) {
                continue;
            }
            let env = new ForFoesEnv(this, targetUnit, enemyUnit, enemyAlly, damageCalcEnv.calcPotentialDamage);
            env.setName('周囲の敵からのデバフ').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_FOES_INFLICTS_STATS_MINUS_HOOKS.evaluateWithUnit(enemyAlly, env);
        }
    },

    /**
     * 戦闘中のバフ決定後の戦闘中の味方からのバフ
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySpursFromAlliesAfterCombatStatusFixedSkills(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方からのバフ(戦闘中バフ決定後)').setLogLevel(getSkillLogLevel())
                .setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_STATS_SKILLS_USING_STATS_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    },

    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    __applySpurForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, damageCalcEnv) {
        for (let func of targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs) {
            func(targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        }
        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('戦闘中バフ決定後バフ').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedNodes.forEach(node => node.evaluate(env));
        STATS_SKILL_USING_STATS_HOOKS.evaluateWithUnit(targetUnit, env);
        if (targetUnit.hasStatusEffect(StatusEffectType.GrandStrategy)) {
            if (!targetUnit.hasStatusEffect(StatusEffectType.Ploy)) {
                this.__applyDebuffReverse(targetUnit, "ステータス:神軍師の策");
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Sabotage)) {
            this.__applySabotage(targetUnit);
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.FoePenaltyDoubler)) {
            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
            enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
        }
        this.__applyBonusReversals(targetUnit, enemyUnit);
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.TeacakeTowerPlus:
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit), 0) * 2;
                    }
                    break;
                case Weapon.DreamHorn:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let maxBuff = targetUnit.getBuffTotalInCombat(enemyUnit);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                            if (maxBuff < unit.buffTotal) {
                                maxBuff = unit.buffTotal;
                            }
                        }
                        let amount = Math.trunc(maxBuff * 0.5);
                        enemyUnit.addAtkDefSpurs(-amount);
                    }
                    break;
                case Weapon.PackleaderTome:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.ArcaneNihility:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                        enemyUnit.atkSpur -= enemyUnit.getAtkBuffInCombat(targetUnit);
                        enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.DesertTigerAxe:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        let atk = targetUnit.getAtkBuffInCombat(enemyUnit);
                        let spd = targetUnit.getAtkBuffInCombat(enemyUnit);
                        let def = targetUnit.getAtkBuffInCombat(enemyUnit);
                        let res = targetUnit.getAtkBuffInCombat(enemyUnit);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                            if (atk < unit.getAtkBuff()) atk = unit.getAtkBuff();
                            if (spd < unit.getSpdBuff()) spd = unit.getSpdBuff();
                            if (def < unit.getDefBuff()) def = unit.getDefBuff();
                            if (res < unit.getResBuff()) res = unit.getResBuff();
                        }
                        targetUnit.addSpurs(atk, spd, def, res);
                    }
                    break;
                case Weapon.BaraNoYari:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25 ||
                            targetUnit.getEvalAtkInCombat(enemyUnit) >= enemyUnit.getEvalAtkInCombat(targetUnit) + 1) {
                            enemyUnit.addAtkDefSpurs(-6);
                        }
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            let max = 0;
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                                let buffTotal;
                                if (unit === targetUnit) {
                                    buffTotal = unit.getBuffTotalInCombat(enemyUnit);
                                } else {
                                    buffTotal = unit.buffTotal;
                                }
                                if (buffTotal > max) {
                                    max = buffTotal;
                                }
                            }
                            let amount = Math.trunc(max * 0.5);
                            targetUnit.atkSpur += amount;
                            enemyUnit.atkSpur -= amount;
                            targetUnit.battleContext.healedHpAfterCombat += 7;
                        }
                    }
                    break;
                case Weapon.VioldrakeBow:
                    if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.WyvernHatchet:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= Math.max(7 - Math.abs(enemyUnit.atkDebuffTotal), 0);
                    }
                    break;
                case Weapon.RingOfAffiancePlus:
                case Weapon.BridalBladePlus:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit), 0) * 2;
                    }
                    break;
                case Weapon.DeadFangAxe:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.SilentBreath:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit), 0) * 2;
                    }
                    break;
                case Weapon.Merikuru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                        let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units);
                        targetUnit.addSpurs(...amounts);
                    }
                    break;
                case PassiveA.PartOfThePlan:
                    this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                    break;
                case Weapon.CrimeanScepter: {
                    let buffs = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                        buffs.push(unit.buffs);
                    }
                    buffs.push([
                        targetUnit.getAtkBuffInCombat(enemyUnit),
                        targetUnit.getSpdBuffInCombat(enemyUnit),
                        targetUnit.getDefBuffInCombat(enemyUnit),
                        targetUnit.getResBuffInCombat(enemyUnit),
                    ]);
                    let amounts = buffs.reduce(
                        (previousValue, currentValue) =>
                            previousValue.map((buff, index) => Math.max(buff, currentValue[index])),
                        [0, 0, 0, 0]);
                    amounts = amounts.map(b => Math.trunc(b * 1.5));
                    amounts[2] = 0;
                    amounts[3] = 0;
                    targetUnit.addSpurs(...amounts);
                }
                    break;
                case Weapon.Queenslance: {
                    let units = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                        if (targetUnit.partnerHeroIndex === unit.heroIndex ||
                            unit.partnerHeroIndex === targetUnit.heroIndex) {
                            units.push(unit);
                        }
                    }
                    let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units);
                    targetUnit.addSpurs(...amounts);
                }
                    break;
                case Weapon.ReginRave:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() + 1 ||
                            targetUnit.hasPositiveStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.getAtkInCombat(enemyUnit) >= enemyUnit.getAtkInCombat(targetUnit) ||
                            targetUnit.hasPositiveStatusEffect()) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                    }
                    break;
                case Weapon.LanceOfHeroics:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                        }
                    }
                    break;
                case Weapon.SnideBow: {
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                    }
                    break;
                }
                case Weapon.FlamefrostBow: {
                    let maxBuff = enemyUnit.getBuffTotalInCombat(targetUnit);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                        maxBuff = Math.max(unit.buffTotal, maxBuff);
                    }

                    let amount = Math.trunc(maxBuff * 0.7);
                    targetUnit.addSpurs(amount, 0, amount, amount);
                }
                    break;
                case Weapon.WyvernOno:
                    targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalDefInCombat(enemyUnit) * 0.20);
                    targetUnit.battleContext.damageReductionValue += Math.trunc(targetUnit.getEvalDefInCombat(enemyUnit) * 0.20);
                    break;
                case Weapon.DefiersSwordPlus:
                case Weapon.DefiersLancePlus:
                case Weapon.DefiersAxePlus:
                case Weapon.DefiersBowPlus:
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.BladeOfFavors:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                    break;
                case Weapon.YonkaiNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            targetUnit.addSpurs(5, 5, 0, 0);
                            let buff = targetUnit.getBuffTotalInCombat(enemyUnit) + enemyUnit.getBuffTotalInCombat(targetUnit);
                            let amount = Math.min(Math.trunc(buff * 0.4), 10);
                            targetUnit.addSpurs(amount, amount, 0, 0);
                        }
                    }
                    break;
                case Weapon.Kormt:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let condA = this.__isThereAllyInSpecifiedSpaces(targetUnit, 3);
                        let condB = this.__isThereAllyIn2Spaces(enemyUnit);
                        let condC = targetUnit.hasPositiveStatusEffect(enemyUnit);
                        let condD = enemyUnit.hasNegativeStatusEffect();
                        let conditions = [condA, condB, condC, condD];
                        let count = conditions.filter(x => x).length;
                        let amount = Math.min(count * 3, 9);
                        enemyUnit.addAllSpur(-amount);
                    }
                    break;
                case Weapon.BridalSunflowerPlus:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
                        targetUnit.defSpur += targetUnit.getDefBuffInCombat(enemyUnit);
                    }
                    break;
                case Weapon.BlazingPolearms:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        let amount = Math.min(6, Math.trunc(targetUnit.getBuffTotalInCombat(enemyUnit) * 0.5));
                        enemyUnit.addAllSpur(-amount);
                    }
                    break;
                case Weapon.BridalOrchidPlus:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
                        targetUnit.resSpur += targetUnit.getResBuffInCombat(enemyUnit);
                    }
                    break;
                case Weapon.AversasNight:
                    if (targetUnit.isWeaponSpecialRefined) {
                        // <特殊錬成効果>
                        if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                            enemyUnit.addSpurs(-4, -4, 0, -4);
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                            enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                        }
                    }
                    break;
                case Weapon.FoxkitFang:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (enemyUnit.weaponType === WeaponType.Sword ||
                            enemyUnit.weaponType === WeaponType.Lance ||
                            enemyUnit.weaponType === WeaponType.Axe ||
                            isWeaponTypeBreath(enemyUnit.weaponType) ||
                            isWeaponTypeBeast(enemyUnit.weaponType)) {

                            if (targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat()) {
                                let atkRes = targetUnit.getResInCombat(enemyUnit);
                                let defRes = enemyUnit.getResInCombat(targetUnit);
                                let spurAmount = Math.min(8, Math.floor((atkRes - defRes) * 0.5));
                                targetUnit.addAllSpur(spurAmount);
                            }
                        }
                    } else {
                        // <錬成効果>
                        let atkRes = targetUnit.getEvalResInPrecombat();
                        let defRes = enemyUnit.getEvalResInPrecombat();
                        targetUnit.addAllSpur(4);
                        if (atkRes > defRes) {
                            let spurAmount = Math.min(8, Math.floor((atkRes - defRes) * 0.8));
                            targetUnit.addAllSpur(spurAmount);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    }
                    break;
                case Weapon.FeruniruNoYouran:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let maxBuff = 0;
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                                maxBuff = Math.max(unit.buffTotal, maxBuff);
                            }
                            targetUnit.atkSpur += maxBuff;
                        }
                    }
                    break;
                case Weapon.HvitrvulturePlus:
                case Weapon.GronnvulturePlus:
                case Weapon.BlarvulturePlus:
                    if (this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.TomeOfReason:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            targetUnit.addAllSpur(4);
                            let amount = Math.trunc((targetUnit.getDefBuffInCombat(enemyUnit) + targetUnit.getResBuffInCombat(enemyUnit)) * 0.6);
                            enemyUnit.atkSpur -= amount;
                            enemyUnit.resSpur -= amount;
                        }
                    }
                    break;
                case Weapon.Gyorru: {
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit), 0) * 2;
                            enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit), 0) * 2;
                        }
                    }
                }
                    break;
                case Weapon.Sogun:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                    }
                    break;
                case Weapon.JotnarBow:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= targetUnit.getAtkBuffInCombat(enemyUnit);
                        enemyUnit.spdSpur -= targetUnit.getSpdBuffInCombat(enemyUnit);
                        enemyUnit.defSpur -= targetUnit.getDefBuffInCombat(enemyUnit);
                    }
                    break;
                case Weapon.TannenbowPlus:
                case Weapon.WinterRapierPlus:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case Weapon.SnowGlobePlus:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case Weapon.FlameOfMuspell:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        let amount = 0;
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit) + enemyUnit.getBuffTotalInCombat(targetUnit);
                        amount = Math.min(Math.trunc(buff * 0.5), 12);
                        if (amount > 0) {
                            targetUnit.addAllSpur(amount);
                        }
                        if (buff >= 10) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.FangedBasilikos:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                                enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit) * 2;
                                enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit) * 2;
                            }
                        }
                    }
                    break;
                case Weapon.DivineMist:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let amount =
                                targetUnit.getDefBuffInCombat(enemyUnit) +
                                targetUnit.getResBuffInCombat(enemyUnit);
                            enemyUnit.atkSpur -= Math.trunc(amount * 0.75);
                        }
                    }
                    break;
                case Weapon.SunflowerBowPlus:
                case Weapon.VictorfishPlus:
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);

                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.DivineSeaSpear:
                    if (targetUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit, 1, 1, 1, 0);
                    }
                    break;
                case Weapon.PeachyParfaitPlus:
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.resSpur += enemyUnit.getResBuffInCombat(targetUnit);

                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.BladeOfRenais:
                    if (targetUnit.battleContext.initiatesCombat
                        || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                    ) {
                        targetUnit.addAllSpur(5);

                        if (targetUnit.hasPositiveStatusEffect(enemyUnit)
                            || targetUnit.hasNegativeStatusEffect()
                        ) {
                            let value = Math.trunc(0.2 * enemyUnit.getDefInCombat(targetUnit));
                            targetUnit.battleContext.healedHpByAttack += value;
                        }
                    }
                    break;
                case Weapon.SneeringAxe:
                    {
                        let atkBuff = enemyUnit.getAtkBuffInCombat(targetUnit);
                        if (atkBuff > 0) {
                            enemyUnit.atkSpur -= atkBuff * 2;
                        }
                        let spdBuff = enemyUnit.getSpdBuffInCombat(targetUnit);
                        if (spdBuff > 0) {
                            enemyUnit.spdSpur -= spdBuff * 2;
                        }
                        let defBuff = enemyUnit.getDefBuffInCombat(targetUnit);
                        if (defBuff > 0) {
                            enemyUnit.defSpur -= defBuff * 2;
                        }
                        let resBuff = enemyUnit.getResBuffInCombat(targetUnit);
                        if (resBuff > 0) {
                            enemyUnit.resSpur -= resBuff * 2;
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                            }
                        }
                    }
                    break;
                case Weapon.BouryakuNoSenkyu:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (targetUnit.buffTotal + enemyUnit.debuffTotal >= 10) {
                            enemyUnit.addAllSpur(-5);
                        }
                    } else {
                        // <錬成効果>
                        if (targetUnit.hasPositiveStatusEffect(targetUnit) || enemyUnit.hasNegativeStatusEffect()) {
                            enemyUnit.addAllSpur(-5);
                        }
                        targetUnit.atkSpur += targetUnit.getAtkBuffInCombat(enemyUnit);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                    break;
                case Weapon.Niu: {
                    let amount = 0;
                    if (!targetUnit.isWeaponRefined) {
                        amount = Math.trunc(enemyUnit.getBuffTotalInCombat(targetUnit) * 0.5);
                    } else {
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit) + enemyUnit.getBuffTotalInCombat(targetUnit);
                        amount = Math.min(Math.trunc(buff * 0.4), 10);
                    }
                    if (amount > 0) {
                        targetUnit.addAllSpur(amount);
                    }
                }
                    break;
                case Weapon.Revatein:
                case Weapon.Blarblade:
                case Weapon.BlarbladePlus:
                case Weapon.Gronnblade:
                case Weapon.GronnbladePlus:
                case Weapon.Rauarblade:
                case Weapon.RauarbladePlus:
                case Weapon.AirisuNoSyo:
                case Weapon.RaisenNoSyo:
                case Weapon.OrdinNoKokusyo:
                case Weapon.TharjasHex:
                    {
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit);
                        if (buff > 0) {
                            targetUnit.atkSpur += buff;
                        }
                    }
                    break;
                case Weapon.AkatsukiNoHikari:
                    if (!targetUnit.isWeaponRefined) {
                        if (enemyUnit.atkDebuffTotal < 0) { targetUnit.atkSpur += -enemyUnit.atkDebuffTotal; }
                        if (enemyUnit.spdDebuffTotal < 0) { targetUnit.spdSpur += -enemyUnit.spdDebuffTotal; }
                        if (enemyUnit.defDebuffTotal < 0) { targetUnit.defSpur += -enemyUnit.defDebuffTotal; }
                        if (enemyUnit.resDebuffTotal < 0) { targetUnit.resSpur += -enemyUnit.resDebuffTotal; }
                    } else {
                        if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                            if (enemyUnit.atkDebuffTotal < 0) { targetUnit.atkSpur += -enemyUnit.atkDebuffTotal; }
                            if (enemyUnit.spdDebuffTotal < 0) { targetUnit.spdSpur += -enemyUnit.spdDebuffTotal; }
                            if (enemyUnit.defDebuffTotal < 0) { targetUnit.defSpur += -enemyUnit.defDebuffTotal; }
                            if (enemyUnit.resDebuffTotal < 0) { targetUnit.resSpur += -enemyUnit.resDebuffTotal; }
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                                targetUnit.atkSpur += 6;
                                targetUnit.resSpur += 6;
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                        }
                    }
                    break;
                case Weapon.HurricaneDagger:
                case Weapon.SyukuseiNoAnki:
                case Weapon.SyukuseiNoAnkiPlus:
                    targetUnit.atkSpur += Math.max(enemyUnit.getBuffTotalInCombat(targetUnit), 0);
                    break;
                case Weapon.Faraflame:
                case Weapon.GunshinNoSyo:
                case Weapon.MitteiNoAnki:
                case Weapon.AokarasuNoSyo:
                    if (targetUnit.isWeaponSpecialRefined) {
                        DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.Blizard:
                case Weapon.HaNoOugiPlus:
                    DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
                    break;
                case Weapon.Hyoushintou:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        DamageCalculationUtility.applyDebuffBlade(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.SyugosyaNoRekkyu:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat() ||
                            targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.spdSpur -= 5;
                            enemyUnit.defSpur -= 5;
                        }
                    }
                    break;
                case Weapon.SaizoNoBakuenshin:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += Math.abs(enemyUnit.atkDebuffTotal);
                        targetUnit.spdSpur += Math.abs(enemyUnit.spdDebuffTotal);
                        targetUnit.defSpur += Math.abs(enemyUnit.defDebuffTotal);
                        targetUnit.resSpur += Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.MeikiNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += Math.abs(enemyUnit.atkDebuffTotal);
                        targetUnit.spdSpur += Math.abs(enemyUnit.spdDebuffTotal);
                        targetUnit.defSpur += Math.abs(enemyUnit.defDebuffTotal);
                        targetUnit.resSpur += Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.ShinkenFalcion:
                case PassiveA.SpdDefIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value;
                            unit.defSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.SpdResIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value;
                            unit.resSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.DefResIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.defSpur += value;
                            unit.resSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkSpdIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value;
                            unit.spdSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkResIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value;
                            unit.resSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkSpdIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.spdSpur += value;
                        });
                    break;
                case PassiveA.AtkDefIdeal3:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value;
                            unit.defSpur += value;
                        },
                        5, 0);
                    break;
                case PassiveA.AtkDefIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.defSpur += value;
                        });
                    break;
                case PassiveA.AtkResIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.resSpur += value;
                        });
                    break;
                case PassiveA.SpdDefIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value; unit.defSpur += value;
                        });
                    break;
                case PassiveA.SpdResIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.spdSpur += value; unit.resSpur += value;
                        });
                    break;
                case PassiveA.DefResIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.defSpur += value; unit.resSpur += value;
                        });
                    break;
                case PassiveA.AtkSpdUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applySpdUnity();
                    }
                    break;
                case PassiveA.AtkDefUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case PassiveA.AtkResUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case PassiveA.SpdDefUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applySpdUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case PassiveA.DefResUnity:
                    if (damageCalcEnv.calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyDefUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case PassiveB.SealAtk4:
                    if (!enemyUnit.battleContext.invalidatesOwnAtkDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.atkDebuffTotal), 0);
                        enemyUnit.atkSpur -= amount;
                    }
                    break;
                case PassiveB.SealSpd4:
                    if (!enemyUnit.battleContext.invalidatesOwnSpdDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.spdDebuffTotal), 0);
                        enemyUnit.spdSpur -= amount;
                    }
                    break;
                case PassiveB.SealDef4:
                    if (!enemyUnit.battleContext.invalidatesOwnDefDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.defDebuffTotal), 0);
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case PassiveB.SealRes4:
                    if (!enemyUnit.battleContext.invalidatesOwnResDebuff) {
                        let amount = Math.max(7 - Math.abs(enemyUnit.resDebuffTotal), 0);
                        enemyUnit.resSpur -= amount;
                    }
                    break;
                case PassiveB.BindingNecklace:
                    if (this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                        targetUnit.addAllSpur(2);
                        enemyUnit.addAllSpur(-2);
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                    }
                    break;
                case PassiveB.BindingNecklacePlus:
                    if (enemyUnit.battleContext.initiatesCombat ||
                        this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                    }
                    break;
                case PassiveC.HumanVirtue2: {
                    let maxBuffs = new Array(4).fill(0);
                    let buffTotals = [];
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                        if (!isWeaponTypeBreathOrBeast(unit.weaponType) &&
                            !unit.hasStatusEffect(StatusEffectType.Panic)) {
                            let buffs = unit.buffs;
                            maxBuffs = maxBuffs.map((v, i) => Math.max(v, buffs[i]));
                            buffTotals.push(unit.buffTotal);
                        }
                    }
                    targetUnit.addSpurs(...maxBuffs);

                    buffTotals.sort((a, b) => b - a);
                    // 周囲2マス以内の竜、獣以外の味方の強化の合計値が高い上位3人の強化の合計値(最大40)
                    let amount = Math.min(40, buffTotals.slice(0, 3).reduce((a, b) => a + b, 0));
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(amount / 100.0, enemyUnit);
                    break;
                }
            }
        }
    },


    __applyBonusReversals(targetUnit, enemyUnit) {
        if (targetUnit.battleContext.isAtkBonusReversal) {
            targetUnit.atkSpur -= Math.max(targetUnit.getAtkBuffInCombat(enemyUnit), 0) * 2;
        }
        if (targetUnit.battleContext.isSpdBonusReversal) {
            targetUnit.spdSpur -= Math.max(targetUnit.getSpdBuffInCombat(enemyUnit), 0) * 2;
        }
        if (targetUnit.battleContext.isDefBonusReversal) {
            targetUnit.defSpur -= Math.max(targetUnit.getDefBuffInCombat(enemyUnit), 0) * 2;
        }
        if (targetUnit.battleContext.isResBonusReversal) {
            targetUnit.resSpur -= Math.max(targetUnit.getResBuffInCombat(enemyUnit), 0) * 2;
        }
    },

    __applyPotent(targetUnit, enemyUnit, baseRatio = 0.4, evalSpd = -25,
                  isFixed = false, canFollowUp = false) {
        let canPotentFollowUp =
            DamageCalculationUtility.examinesCanFollowupAttack(targetUnit, enemyUnit, evalSpd) || canFollowUp;
        if (canPotentFollowUp) {
            let potentRatio = baseRatio;
            if (!targetUnit.battleContext.isTwiceAttackActivating() &&
                !targetUnit.battleContext.canFollowupAttackWithoutPotent) {
                potentRatio = baseRatio * 2;
            }
            if (isFixed) {
                potentRatio = baseRatio;
            }
            targetUnit.battleContext.potentRatios.push(potentRatio);
        }
    },

    // 最も高い強化値を返す。
    // 対象キャラ全員にパニックがかかっている場合でもマイナスは返さない（0を返す）。
    __getHighestBuffs(targetUnit, enemyUnit, units, withTargetUnit = false) {
        let buffsArray = [];
        if (withTargetUnit) {
            buffsArray.push(targetUnit.getBuffsInCombat(enemyUnit));
        }
        for (let unit of units) {
            buffsArray.push(unit.buffs);
        }
        buffsArray.push([
            targetUnit.getAtkBuffInCombat(enemyUnit),
            targetUnit.getSpdBuffInCombat(enemyUnit),
            targetUnit.getDefBuffInCombat(enemyUnit),
            targetUnit.getResBuffInCombat(enemyUnit),
        ]);
        let func = (previousBuffs, currentBuffs) =>
            previousBuffs.map((buff, index) => Math.max(buff, currentBuffs[index]));
        return buffsArray.reduce(func, [0, 0, 0, 0]);
    },

    __getHighestTotalBuff(targetUnit, enemyUnit, units, withTargetUnit = false) {
        let buffArray = [];
        if (withTargetUnit) {
            buffArray.push(targetUnit.getBuffTotalInCombat(enemyUnit));
        }
        for (let unit of units) {
            buffArray.push(unit.buffTotal);
        }
        return Math.max(...buffArray);
    },

    __applyBuffAbsorption(targetUnit, enemyUnit,
        atk = 1, spd = 1, def = 1, res = 1) {
        let enemyBuffs = enemyUnit.getBuffsInCombat(targetUnit);
        let enables = [atk, spd, def, res];
        enemyBuffs = enemyBuffs.map((v, i) => v * enables[i]);
        targetUnit.addSpurs(...enemyBuffs);
        enemyUnit.addSpurs(...enemyBuffs.map(v => -v));
    },

    __applyDebuffReverse(targetUnit, skillName = "弱化反転効果") {
        let spurs = targetUnit.debuffTotals.map(i => Math.abs(i) * 2);
        if (this.isLogEnabled) {
            let message = `${skillName}により攻+${spurs[0]}, 速+${spurs[1]}, 守+${spurs[2]}, 魔+${spurs[3]}`;
            this.__writeDamageCalcDebugLog(message);
        }
        targetUnit.addSpurs(...spurs);
    },

    __applySabotage(targetUnit, spaces = 2, withTargetUnit = true) {
        let maxDebuffs = this.__maxDebuffsFromAlliesWithinSpecificSpaces(targetUnit, spaces, withTargetUnit);
        targetUnit.addSpurs(...maxDebuffs);
    },

    // 能力値ごとの最大のデバフを返す
    // デバフが最大とはマイナスの値が大きいことであることに注意
    __maxDebuffsFromAlliesWithinSpecificSpaces(targetUnit, spaces = 2, withTargetUnit = true) {
        let debuffsArray = [];
        if (withTargetUnit) {
            // 戦闘相手は戦闘中弱化無効を考慮
            debuffsArray.push(targetUnit.debuffTotals);
        }
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces)) {
            // 周囲のユニットは戦闘中弱化無効を考慮しない
            debuffsArray.push(unit.getDebuffTotals(true));
        }
        let func = (previousDebuffs, currentDebuffs) =>
            previousDebuffs.map((debuff, index) => Math.min(debuff, currentDebuffs[index]));
        return debuffsArray.reduce(func, [0, 0, 0, 0]);
    },

    __applyPotentSkillEffect(targetUnit, enemyUnit, damageCalcEnv) {
        let env = new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, null);
        env.setName('神速判定時').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        WHEN_APPLIES_POTENT_EFFECTS_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let skillId of targetUnit.enumerateSkills()) {
            getSkillFunc(skillId, applyPotentSkillEffectFuncMap)?.call(this, targetUnit, enemyUnit);
        }
    },

    /**
     * 周囲の味方からの神速追撃を行うスキル
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applyPotentSkillEffectFromAllies(targetUnit, enemyUnit, damageCalcEnv) {
        if (enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }

        if (damageCalcEnv.calcPotentialDamage) {
            return;
        }
        for (let allyUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__canDisableSkillsFrom(enemyUnit, targetUnit, allyUnit)) {
                continue
            }
            let env = new ForAlliesEnv(this, targetUnit, enemyUnit, allyUnit);
            env.setName('周囲の味方からの神速追撃判定時').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
                .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
            FOR_ALLIES_WHEN_APPLIES_POTENT_EFFECTS_HOOKS.evaluateWithUnit(allyUnit, env);
        }
    },

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} allyUnit
     * @param  {Boolean} calcPotentialDamage
     */
    __addSpurInRange2(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of allyUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.SacrificeStaff:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.StaffOfLilies:
                    if (allyUnit.isWeaponSpecialRefined) {
                        targetUnit.addDefResSpurs(6);
                    }
                    break;
                case Weapon.MasyumaroNoTsuePlus:
                    targetUnit.addDefResSpurs(3);
                    break;
                case Weapon.SunshadeStaff:
                    targetUnit.atkSpur += 6;
                    break;
                case Weapon.GuidesHourglass:
                    targetUnit.addAllSpur(4);
                    break;
                case PassiveC.AllTogether:
                    targetUnit.addAllSpur(4);
                    break;
                case Captain.Effulgence:
                    targetUnit.addSpurs(4, 4, 0, 0);
                    break;
                case PassiveC.OpeningRetainer:
                    targetUnit.atkSpur += 4;
                    break;
                case PassiveC.EverlivingDomain:
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                    break;
                case PassiveC.DomainOfFlame:
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 4;
                    break;
                case PassiveC.DomainOfIce:
                    targetUnit.spdSpur += 4;
                    targetUnit.resSpur += 4;
                    break;
                case PassiveC.JointDriveAtk:
                    targetUnit.atkSpur += 4;
                    break;
                case PassiveC.JointDriveSpd:
                    targetUnit.spdSpur += 4;
                    break;
                case PassiveC.JointDriveRes:
                    targetUnit.resSpur += 4;
                    break;
                case PassiveC.JointDriveDef:
                    targetUnit.defSpur += 4;
                    break;
                case PassiveC.DriveAtk1:
                    targetUnit.atkSpur += 2;
                    break;
                case PassiveC.DriveAtk2:
                    targetUnit.atkSpur += 3;
                    break;
                case PassiveC.DriveSpd1:
                    targetUnit.spdSpur += 2;
                    break;
                case PassiveC.DriveSpd2:
                    targetUnit.spdSpur += 3;
                    break;
                case PassiveC.DriveDef1:
                    targetUnit.defSpur += 2;
                    break;
                case PassiveC.DriveDef2:
                    targetUnit.defSpur += 3;
                    break;
                case PassiveC.DriveRes1:
                    targetUnit.resSpur += 2;
                    break;
                case PassiveC.DriveRes2:
                    targetUnit.resSpur += 3;
                    break;
                case PassiveC.WardArmor:
                    if (targetUnit.moveType === MoveType.Armor) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadArmor:
                    if (targetUnit.moveType === MoveType.Armor) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case PassiveC.WardFliers:
                    if (targetUnit.moveType === MoveType.Flying) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadFliers:
                    if (targetUnit.moveType === MoveType.Flying) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case PassiveC.WardCavalry:
                    if (targetUnit.moveType === MoveType.Cavalry) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadCavalry:
                    if (targetUnit.moveType === MoveType.Cavalry) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case PassiveC.WardBeasts:
                    if (isWeaponTypeBeast(targetUnit.weaponType)) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadBeasts:
                    if (isWeaponTypeBeast(targetUnit.weaponType)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case PassiveC.WardDragons:
                    if (isWeaponTypeBreath(targetUnit.weaponType)) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.GoadDragons:
                    if (isWeaponTypeBreath(targetUnit.weaponType)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
            }
        }
        switch (allyUnit.weapon) {
            case Weapon.Gjallarbru:
                if (allyUnit.isWeaponSpecialRefined) {
                    targetUnit.addSpurs(4, 4, 0, 0);
                }
                break;
            case Weapon.YoukoohNoTsumekiba:
                if (allyUnit.isWeaponSpecialRefined) {
                    targetUnit.addSpurs(0, 0, 2, 2);
                }
                break;
            case Weapon.IzunNoKajitsu:
                if (allyUnit.isWeaponRefined) {
                    if (allyUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                }
                break;
            case Weapon.AlliedSwordPlus:
            case Weapon.AlliedLancePlus:
            case Weapon.AlliedAxePlus:
            case Weapon.LoveCandelabraPlus:
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
                break;
            case Weapon.LoveBouquetPlus:
                targetUnit.atkSpur += 4;
                targetUnit.resSpur += 4;
                break;
            case Weapon.GigaExcalibur:
                if (allyUnit.isWeaponSpecialRefined) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
                break;
            case Weapon.RespitePlus:
            case Weapon.TannenbatonPlus:
                targetUnit.defSpur += 2;
                targetUnit.resSpur += 2;
                break;
            case Weapon.Geirusukeguru:
                if (targetUnit.isPhysicalAttacker()) {
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    if (allyUnit.isWeaponSpecialRefined) {
                        targetUnit.defSpur += 3;
                        targetUnit.resSpur += 3;
                    }
                }
                break;
            case Weapon.KamiraNoEnfu:
                if (allyUnit.isWeaponSpecialRefined) {
                    if (targetUnit.moveType === MoveType.Flying || targetUnit.moveType === MoveType.Cavalry) {
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                    }
                }
                break;
            case Weapon.Simuberin:
                if (allyUnit.isWeaponRefined) {
                    targetUnit.atkSpur += 3;
                }
                break;
            case Weapon.FalchionRefined:
                if (allyUnit.isWeaponSpecialRefined) {
                    targetUnit.addAllSpur(2);
                }
                break;
            case Weapon.ChichiNoSenjutsusyo:
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                break;
            case Weapon.JunaruSenekoNoTsumekiba:
                if (!allyUnit.isWeaponRefined) {
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                }
                break;
            case Weapon.RirisuNoUkiwa:
            case Weapon.RirisuNoUkiwaPlus:
            case Weapon.TomatoNoHon:
            case Weapon.TomatoNoHonPlus:
            case Weapon.NettaigyoNoHon:
            case Weapon.NettaigyoNoHonPlus:
            case Weapon.HaibisukasuNoHon:
            case Weapon.HaibisukasuNoHonPlus:
                targetUnit.atkSpur += 1;
                targetUnit.spdSpur += 1;
                break;
            case Weapon.Yatonokami:
                if (allyUnit.isWeaponSpecialRefined) {
                    if (targetUnit.partnerHeroIndex === allyUnit.heroIndex) {
                        targetUnit.addAllSpur(4);
                    }
                }
                break;
            case Weapon.Kadomatsu:
            case Weapon.KadomatsuPlus:
            case Weapon.Hamaya:
            case Weapon.HamayaPlus:
            case Weapon.Hagoita:
            case Weapon.HagoitaPlus:
                targetUnit.defSpur += 2;
                targetUnit.resSpur += 2;
                break;
            case Weapon.SenhimeNoWakyu:
                if (allyUnit.isWeaponRefined) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
                else {
                    targetUnit.atkSpur += 3;
                }
                break;

            default:
                break;
        }
    },

    __addSpurInRange1(targetUnit, skillId, _calcPotentialDamage) {
        switch (skillId) {
            case PassiveC.SpurAtk1:
                targetUnit.atkSpur += 2;
                break;
            case PassiveC.SpurSpd1:
                targetUnit.spdSpur += 2;
                break;
            case PassiveC.SpurDef1:
                targetUnit.defSpur += 2;
                break;
            case PassiveC.SpurRes1:
                targetUnit.resSpur += 2;
                break;
            case PassiveC.SpurAtk2:
                targetUnit.atkSpur += 3;
                break;
            case PassiveC.SpurSpd2:
                targetUnit.spdSpur += 3;
                break;
            case PassiveC.SpurDef2:
                targetUnit.defSpur += 3;
                break;
            case PassiveC.SpurRes2:
                targetUnit.resSpur += 3;
                break;
            case PassiveC.SpurAtk3:
                targetUnit.atkSpur += 4;
                break;
            case PassiveC.SpurSpd3:
                targetUnit.spdSpur += 4;
                break;
            case PassiveC.SpurDef3:
                targetUnit.defSpur += 4;
                break;
            case PassiveC.SpurRes3:
                targetUnit.resSpur += 4;
                break;
            case PassiveC.SpurDefRes1:
                targetUnit.defSpur += 2;
                targetUnit.resSpur += 2;
                break;
            case PassiveC.SpurDefRes2:
                targetUnit.defSpur += 3;
                targetUnit.resSpur += 3;
                break;
            case PassiveC.SpurSpdRes2:
                targetUnit.spdSpur += 3;
                targetUnit.resSpur += 3;
                break;
            case PassiveC.SpurSpdDef1:
                targetUnit.spdSpur += 2;
                targetUnit.defSpur += 2;
                break;
            case PassiveC.SpurSpdDef2:
                targetUnit.spdSpur += 3;
                targetUnit.defSpur += 3;
                break;
            case PassiveC.SpurAtkRes1:
                targetUnit.atkSpur += 2;
                targetUnit.resSpur += 2;
                break;
            case PassiveC.SpurAtkRes2:
                targetUnit.atkSpur += 3;
                targetUnit.resSpur += 3;
                break;
            case PassiveC.SpurAtkDef2:
                targetUnit.atkSpur += 3;
                targetUnit.defSpur += 3;
                break;
            case PassiveC.SpurAtkSpd1:
                targetUnit.atkSpur += 2;
                targetUnit.spdSpur += 2;
                break;
            case PassiveC.SpurAtkSpd2:
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                break;
            default:
                break;
        }
    },

    __addSelfSpurInRange1(targetUnit, skillId, _calcPotentialDamage) {
        switch (skillId) {
            case Weapon.RauaAuru:
            case Weapon.GurunAuru:
            case Weapon.RauaAuruPlus:
            case Weapon.GurunAuruPlus:
            case Weapon.BuraAuru:
            case Weapon.BuraAuruPlus:
                targetUnit.addAllSpur(2);
                break;
            case Weapon.YamaNoInjaNoSyo:
            case Weapon.WindsBrand:
                if (targetUnit.isWeaponSpecialRefined) {
                    targetUnit.addAllSpur(2);
                }
                break;
        }
    },

    __countBreakableDefenseStructuresWithoutEnergyOnMap() {
        return this.map.countObjs(st => st instanceof DefenceStructureBase && !(st instanceof Ornament) && st.isBreakable && !st.isRequired);
    },

    __countDefenceStructuresOnMap() {
        return this.__countBreakableDefenseStructuresWithoutEnergyOnMap() + 1;
    },

    __calcKojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count <= 2) {
            return 10;
        }
        else if (count === 3) {
            return 7;
        }
        else if (count === 4) {
            return 4;
        }
        else {
            return 1;
        }
    },

    __calcBojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count >= 5) {
            return 10;
        }
        else if (count === 4) {
            return 7;
        }
        else if (count === 3) {
            return 4;
        }
        else {
            return 1;
        }
    },

    __calcBojosen4SpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count >= 5) {
            return 11;
        } else if (count === 4) {
            return 7;
        } else {
            return 3;
        }
    },
    __applyFormSkill(targetUnit, buffFunc, addSpur = 0, spaces = 2, spurLimit = 6) {
        let spurAmount = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
            spurAmount += 2;
        }
        if (spurAmount === 0) return;
        if (spurAmount > spurLimit) {
            spurAmount = spurLimit;
        }
        buffFunc(targetUnit, spurAmount + addSpur);
    },

    updateAllUnitSpur(calcPotentialDamage = false) {
        for (let unit of this._unitManager.enumerateUnitsWithPredicator(x => x.isOnMap)) {
            this.updateUnitSpur(unit, calcPotentialDamage);
        }
    },

    /**
     * @param {Unit} targetUnit
     * @param {boolean} calcPotentialDamage=false
     * @param {Unit} enemyUnit
     * @param {number} damageType
     */
    updateUnitSpur(targetUnit, calcPotentialDamage = false, enemyUnit = null, damageType = DamageType.PotentialDamage) {
        let self = this;
        this.profiler.profile("updateUnitSpur", () => {
            self.__updateUnitSpur(targetUnit, calcPotentialDamage, enemyUnit, damageType);
        });
    },

    /**
     * @param  {Unit} targetUnit
     * @param  {boolean} calcPotentialDamage
     * @param  {Unit} enemyUnit
     * @param  {number} damageType
     */
    __updateUnitSpur(targetUnit, calcPotentialDamage, enemyUnit = null, damageType) {
        // 主に暗闘スキルの処理
        // 暗闘は戦闘中の2人が必要
        if (targetUnit && enemyUnit) {
            targetUnit && this.__applyPreUpdateUnitSpurSkillEffects(targetUnit, enemyUnit, calcPotentialDamage);
            enemyUnit && this.__applyPreUpdateUnitSpurSkillEffects(enemyUnit, targetUnit, calcPotentialDamage);
        }

        targetUnit.resetSpurs();

        if (!calcPotentialDamage) {
            // 周囲の味方から受ける紋章バフ
            this.__updateUnitSpurFromAllies(targetUnit, calcPotentialDamage, enemyUnit);
            // 周囲の敵から受ける紋章バフ
            this.__updateUnitSpurFromEnemyAllies(targetUnit, calcPotentialDamage, enemyUnit, damageType);
        }

        let isAllyAvailableRange1 = false;
        let isAllyAvailableRange2 = false;

        // 支援
        if (!calcPotentialDamage)// ワユ教授の資料だと支援は加味されると書いてあるが検証したら含まれなかった
        {
            // 支援は重複しないので元も近いユニットで計算
            let nearestPartner = null;
            let nearestDist = 1000;
            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                if (targetUnit.partnerHeroIndex === unit.heroIndex) {
                    let dist = calcDistance(targetUnit.posX, targetUnit.posY, unit.posX, unit.posY);
                    if (dist < nearestDist) {
                        nearestPartner = unit;
                        nearestDist = dist;
                    }
                }
            }

            if (nearestPartner != null && !targetUnit.battleContext.invalidatesSupportEffect) {
                let unit = nearestPartner;
                switch (targetUnit.partnerLevel) {
                    case PartnerLevel.C:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.resSpur += 2;
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.resSpur += 1;
                        }
                        break;
                    case PartnerLevel.B:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.defSpur += 1;
                            targetUnit.resSpur += 1;
                        }
                        break;
                    case PartnerLevel.A:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.spdSpur += 2;
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.spdSpur += 1;
                            targetUnit.defSpur += 1;
                            targetUnit.resSpur += 1;
                        }
                        break;
                    case PartnerLevel.S:
                        if (this.__isNear(unit, targetUnit, 1)) {
                            targetUnit.addAllSpur(2);
                        } else if (this.__isNear(unit, targetUnit, 2)) {
                            targetUnit.addAllSpur(1);
                        }
                        break;
                    case PartnerLevel.SPlus:
                        targetUnit.addAllSpur(2);
                        targetUnit.addSpurs(...(ArrayUtil.maxByIndex(
                            EntwinedValues.get(targetUnit.entwinedId) ?? [0, 0, 0, 0],
                            EntwinedValues.get(nearestPartner.entwinedId) ?? [0, 0, 0, 0]
                        )));
                        break;
                }
            }
        }

        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__isNear(unit, targetUnit, 2)) {
                // 2マス以内で発動する戦闘中バフ
                // this.writeDebugLogLine(unit.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                isAllyAvailableRange2 = true;
            }

            if (this.__isNear(unit, targetUnit, 1)) {
                // 1マス以内で発動する戦闘中バフ
                this.__addSelfSpurInRange1(targetUnit, targetUnit.weapon, calcPotentialDamage);
                isAllyAvailableRange1 = true;
            }
        }

        // 味方と隣接しているときに発動するスキル
        if (isAllyAvailableRange1 && !calcPotentialDamage) {
            switch (targetUnit.weapon) {
                case Weapon.SyukusaiNoOnoPlus:
                case Weapon.AoNoHanakagoPlus:
                case Weapon.MidoriNoHanakagoPlus:
                case Weapon.SyukusaiNoKenPlus:
                case Weapon.HanawaPlus:
                    targetUnit.addAllSpur(3);
                    break;
                case Weapon.FalchionAwakening:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.Fensariru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                default:
                    break;
            }

            for (let skillId of targetUnit.enumerateSkills()) {
                if (skillId === NoneValue) { continue; }
                switch (skillId) {
                    case PassiveA.AtkSpdBond4:
                        targetUnit.atkSpur += 7;
                        targetUnit.spdSpur += 7;
                        break;
                    case PassiveA.AtkDefBond4:
                        targetUnit.atkSpur += 7;
                        targetUnit.defSpur += 7;
                        break;
                    case PassiveA.AtkResBond4:
                        targetUnit.atkSpur += 7;
                        targetUnit.resSpur += 7;
                        break;
                    case PassiveA.SpdDefBond4:
                        targetUnit.spdSpur += 7;
                        targetUnit.defSpur += 7;
                        break;
                    case PassiveA.SpdResBond4:
                        targetUnit.spdSpur += 7;
                        targetUnit.resSpur += 7;
                        break;
                    case PassiveA.AtkSpdBond1:
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        break;
                    case PassiveA.AtkSpdBond2:
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                        break;
                    case PassiveA.AtkSpdBond3:
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        break;
                    case PassiveA.AtkResBond1:
                        targetUnit.atkSpur += 3;
                        targetUnit.resSpur += 3;
                        break;
                    case PassiveA.AtkResBond2:
                        targetUnit.atkSpur += 4;
                        targetUnit.resSpur += 4;
                        break;
                    case PassiveA.AtkResBond3:
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        break;
                    case PassiveA.AtkDefBond1:
                        targetUnit.atkSpur += 3;
                        targetUnit.defSpur += 3;
                        break;
                    case PassiveA.AtkDefBond2:
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        break;
                    case PassiveA.AtkDefBond3:
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        break;
                    case PassiveA.SpdDefBond1:
                        targetUnit.spdSpur += 3;
                        targetUnit.defSpur += 3;
                        break;
                    case PassiveA.SpdDefBond2:
                        targetUnit.spdSpur += 4;
                        targetUnit.defSpur += 4;
                        break;
                    case PassiveA.SpdDefBond3:
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                        break;
                    case PassiveA.SpdResBond1:
                        targetUnit.spdSpur += 3;
                        targetUnit.resSpur += 3;
                        break;
                    case PassiveA.SpdResBond2:
                        targetUnit.spdSpur += 4;
                        targetUnit.resSpur += 4;
                        break;
                    case PassiveA.SpdResBond3:
                        targetUnit.spdSpur += 5;
                        targetUnit.resSpur += 5;
                        break;
                    case PassiveA.DefResBond1:
                        targetUnit.defSpur += 3;
                        targetUnit.resSpur += 3;
                        break;
                    case PassiveA.DefResBond2:
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                        break;
                    case PassiveA.DefResBond3:
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                        break;
                    case PassiveA.DefResBond4:
                        targetUnit.defSpur += 7;
                        targetUnit.resSpur += 7;
                        break;
                    default:
                        break;
                }
            }
        }

        // 味方が2マス以内にいる時に発動するスキル
        if (isAllyAvailableRange2 && !calcPotentialDamage) {
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.AlliedSwordPlus:
                    case Weapon.AlliedLancePlus:
                    case Weapon.AlliedAxePlus:
                    case Weapon.LoveCandelabraPlus:
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        break;
                    case Weapon.LoveBouquetPlus:
                        targetUnit.atkSpur += 4;
                        targetUnit.resSpur += 4;
                        break;
                    case Weapon.GigaExcalibur:
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case Weapon.Gurimowaru:
                    case Weapon.SenhimeNoWakyu:
                        if (targetUnit.isWeaponRefined) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case Weapon.ChichiNoSenjutsusyo:
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        break;
                    case Weapon.JunaruSenekoNoTsumekiba:
                        if (!targetUnit.isWeaponRefined) {
                            targetUnit.atkSpur += 3;
                            targetUnit.defSpur += 3;
                        }
                        break;
                    case Weapon.OgonNoFolkPlus:
                    case Weapon.NinjinhuNoSosyokuPlus:
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        break;
                    case PassiveC.JointDriveAtk:
                        targetUnit.atkSpur += 4;
                        break;
                    case PassiveC.JointDriveSpd:
                        targetUnit.spdSpur += 4;
                        break;
                    case PassiveC.JointDriveRes:
                        targetUnit.resSpur += 4;
                        break;
                    case PassiveC.JointDriveDef:
                        targetUnit.defSpur += 4;
                        break;
                }
            }
        }

        // 孤軍
        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
            switch (targetUnit.weapon) {
                case Weapon.TallHammer:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.spdSpur += 6;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.GousouJikumunto:
                    if (!targetUnit.isWeaponRefined) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.KurokiChiNoTaiken:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
            }

            for (let skillId of [targetUnit.passiveA, targetUnit.passiveS]) {
                if (skillId === NoneValue) { continue; }
                switch (skillId) {
                    case PassiveA.AtkSpdSolo3:
                        targetUnit.atkSpur += 6; targetUnit.spdSpur += 6;
                        break;
                    case PassiveA.AtkDefSolo4:
                        targetUnit.atkSpur += 7; targetUnit.defSpur += 7;
                        break;
                    case PassiveA.AtkSpdSolo4:
                        targetUnit.atkSpur += 7; targetUnit.spdSpur += 7;
                        break;
                    case PassiveA.AtkResSolo3:
                        targetUnit.atkSpur += 6; targetUnit.resSpur += 6;
                        break;
                    case PassiveA.AtkResSolo4:
                        targetUnit.atkSpur += 7; targetUnit.resSpur += 7;
                        break;
                    case PassiveA.AtkDefSolo3:
                        targetUnit.atkSpur += 6; targetUnit.defSpur += 6;
                        break;
                    case PassiveA.DefResSolo3:
                        targetUnit.defSpur += 6; targetUnit.resSpur += 6;
                        break;
                    case PassiveA.DefResSolo4:
                        targetUnit.defSpur += 7; targetUnit.resSpur += 7;
                        break;
                    case PassiveA.SpdDefSolo3:
                        targetUnit.spdSpur += 6; targetUnit.defSpur += 6;
                        break;
                    case PassiveA.SpdResSolo3:
                        targetUnit.spdSpur += 6; targetUnit.resSpur += 6;
                        break;
                    case PassiveA.SpdDefSolo4:
                        targetUnit.spdSpur += 7; targetUnit.defSpur += 7;
                        break;
                    case PassiveA.SpdResSolo4:
                        targetUnit.spdSpur += 7; targetUnit.resSpur += 7;
                        break;
                }
            }
        }

        // その他
        {
            // 潜在ダメージ計算に加味される効果
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    // リーダースキル
                    case Captain.SecretManeuver:
                        targetUnit.spdSpur += 5;
                        break;
                    case Captain.Effulgence:
                        targetUnit.addSpurs(4, 4, 0, 0);
                        break;
                    case Captain.MassConfusion:
                        targetUnit.atkSpur += 5;
                        break;

                    // ユニットスキル
                    case PassiveA.AtkSpdBojosen3:
                        {
                            let spurAmount = this.__calcBojosenSpurAmount();
                            targetUnit.atkSpur += spurAmount;
                            targetUnit.spdSpur += spurAmount;
                        }
                        break;
                    case PassiveA.AtkResBojosen3:
                        {
                            let spurAmount = this.__calcBojosenSpurAmount();
                            targetUnit.atkSpur += spurAmount;
                            targetUnit.resSpur += spurAmount;
                        }
                        break;
                    case PassiveA.SpdDefBojosen3:
                        {
                            let spurAmount = this.__calcBojosenSpurAmount();
                            targetUnit.spdSpur += spurAmount;
                            targetUnit.defSpur += spurAmount;
                        }
                        break;
                    case PassiveA.DefResBojosen3:
                        {
                            let spurAmount = this.__calcBojosenSpurAmount();
                            targetUnit.resSpur += spurAmount;
                            targetUnit.defSpur += spurAmount;
                        }
                        break;
                    case PassiveA.SpdResBojosen3:
                        {
                            let spurAmount = this.__calcBojosenSpurAmount();
                            targetUnit.spdSpur += spurAmount;
                            targetUnit.resSpur += spurAmount;
                        }
                        break;
                    case PassiveA.AtkDefBojosen3:
                        {
                            let spurAmount = this.__calcBojosenSpurAmount();
                            targetUnit.atkSpur += spurAmount;
                            targetUnit.defSpur += spurAmount;
                        }
                        break;
                    case PassiveA.AtkDefKojosen3:
                        {
                            let spurAmount = this.__calcKojosenSpurAmount();
                            targetUnit.atkSpur += spurAmount;
                            targetUnit.defSpur += spurAmount;
                        }
                        break;
                    case PassiveA.AtkSpdKojosen3:
                        {
                            let spurAmount = this.__calcKojosenSpurAmount();
                            targetUnit.atkSpur += spurAmount;
                            targetUnit.spdSpur += spurAmount;
                        }
                        break;
                    case PassiveA.SpdResKojosen3:
                        {
                            let spurAmount = this.__calcKojosenSpurAmount();
                            targetUnit.spdSpur += spurAmount;
                            targetUnit.resSpur += spurAmount;
                        }
                        break;
                    case PassiveA.AtkSpdBojosen4: {
                        let spurAmount = this.__calcBojosen4SpurAmount();
                        targetUnit.atkSpur += spurAmount;
                        targetUnit.spdSpur += spurAmount;
                    }
                        break;
                    case PassiveA.DefResBojosen4: {
                        let spurAmount = this.__calcBojosen4SpurAmount();
                        targetUnit.defSpur += spurAmount;
                        targetUnit.resSpur += spurAmount;
                    }
                        break;
                }
            }

            // 潜在ダメージ計算で無視される効果
            if (!calcPotentialDamage) {
                for (let skillId of targetUnit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.Rigarublade:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => isWeaponTypeTome(x.weaponType) && x.moveType === MoveType.Infantry)
                                ) {
                                    targetUnit.addAllSpur(3);
                                }
                            }
                            break;
                        case Weapon.Vidofuniru:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => x.moveType === MoveType.Armor || x.moveType === MoveType.Infantry)
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.spdSpur += 5;
                                }
                            }
                            break;
                        case Weapon.HinokaNoKounagitou:
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType === MoveType.Flying || x.moveType === MoveType.Infantry)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                            break;
                        case Weapon.KamiraNoEnfu:
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType === MoveType.Flying || x.moveType === MoveType.Cavalry)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                            break;
                        case Weapon.Simuberin:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => x.moveType === MoveType.Flying)
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.resSpur += 5;
                                }
                            }
                            break;
                        case Weapon.Ora:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                    x => x.weaponType === WeaponType.Staff || isWeaponTypeTome(x.weaponType))
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.spdSpur += 5;
                                }
                            }
                            break;
                        case Weapon.KyomeiOra:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                    x.isMeleeWeaponType())
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.spdSpur += 5;
                                }
                            }
                            break;
                        case Weapon.Excalibur:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                    x.weaponType === WeaponType.Staff || isWeaponTypeTome(x.weaponType))
                                ) {
                                    targetUnit.atkSpur += 4;
                                    targetUnit.spdSpur += 4;
                                }
                            }
                            break;
                        case Weapon.KentoushiNoGoken:
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                    x.moveType === MoveType.Infantry || x.moveType === MoveType.Flying)
                                ) {
                                    targetUnit.atkSpur += 4;
                                    targetUnit.spdSpur += 4;
                                }
                            }
                            break;
                        case Weapon.RosenshiNoKofu:
                            if (targetUnit.isWeaponSpecialRefined) {
                                let isAvailable = false;
                                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                                    if (unit.moveType === MoveType.Infantry
                                        || unit.moveType === MoveType.Cavalry) {
                                        unit.atkSpur += 3;
                                        unit.defSpur += 3;
                                        isAvailable = true;
                                    }
                                }
                                if (isAvailable) {
                                    targetUnit.atkSpur += 3;
                                    targetUnit.defSpur += 3;
                                }
                            }
                            break;
                        case Weapon.YouheidanNoNakayari:
                            if (targetUnit.isWeaponSpecialRefined) {
                                let isAvailable = false;
                                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                                    if (unit.moveType === MoveType.Infantry
                                        || unit.moveType === MoveType.Cavalry) {
                                        unit.atkSpur += 3;
                                        unit.spdSpur += 3;
                                        isAvailable = true;
                                    }
                                }
                                if (isAvailable) {
                                    targetUnit.atkSpur += 3;
                                    targetUnit.spdSpur += 3;
                                }
                            }
                            break;
                        case Weapon.KachuNoYari:
                        case Weapon.HimekishiNoYari:
                            if (targetUnit.isWeaponSpecialRefined) {
                                let partners = this.__getPartnersInSpecifiedRange(targetUnit, 2);
                                for (let unit of partners) {
                                    unit.addAllSpur(3);
                                }
                                if (partners.length > 0) {
                                    targetUnit.addAllSpur(3);
                                }
                            }
                            break;
                        case Weapon.Nizuheggu:
                        case Weapon.KatarinaNoSyo:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.atkSpur += amount;
                                    unit.spdSpur += amount;
                                    unit.defSpur += amount;
                                    unit.resSpur += amount;
                                }, 0, 1, 100);
                            break;
                        case Weapon.KurohyoNoYari:
                        case Weapon.MogyuNoKen:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.atkSpur += amount;
                                    unit.defSpur += amount;
                                });
                            break;
                        case Weapon.KiraboshiNoBreathPlus:
                        case Weapon.HuyumatsuriNoBootsPlus:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.defSpur += amount;
                                    unit.resSpur += amount;
                                });
                            break;
                        case Weapon.NifuruNoHyoka:
                            if (targetUnit.isWeaponRefined) break;
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.atkSpur += amount;
                                    unit.spdSpur += amount;
                                });
                            break;
                        case Weapon.MusuperuNoEnka:
                            if (!targetUnit.isWeaponRefined) {
                                this.__applyFormSkill(targetUnit,
                                    (unit, amount) => {
                                        unit.atkSpur += amount;
                                        unit.spdSpur += amount;
                                    });
                            } else {
                                this.__applyFormSkill(targetUnit,
                                    (unit, amount) => {
                                        unit.atkSpur += amount;
                                        unit.spdSpur += 5;
                                    }, 5, 3, 9);
                            }
                            break;
                        case PassiveA.SpdResForm3:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.spdSpur += amount;
                                    unit.resSpur += amount;
                                }, 1);
                            break;
                        case PassiveA.AtkSpdForm3:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.atkSpur += amount;
                                    unit.spdSpur += amount;
                                }, 1);
                            break;
                        case PassiveA.AtkDefForm3:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.atkSpur += amount;
                                    unit.defSpur += amount;
                                }, 1);
                            break;
                        case PassiveA.AtkResForm3:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.atkSpur += amount;
                                    unit.resSpur += amount;
                                }, 1);
                            break;
                        case PassiveA.SpdDefForm3:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.spdSpur += amount;
                                    unit.defSpur += amount;
                                }, 1);
                            break;
                        case PassiveA.DefResForm3:
                            this.__applyFormSkill(targetUnit,
                                (unit, amount) => {
                                    unit.defSpur += amount;
                                    unit.resSpur += amount;
                                }, 1);
                            break;
                    }
                }
            }
        }
    },


    /**
     * @param {Unit} targetUnit
     * @param {boolean} calcPotentialDamage
     * @param {Unit} enemyUnit
     * @param {number} damageType
     */
    __updateUnitSpurFromEnemyAllies(targetUnit, calcPotentialDamage, enemyUnit, damageType) {
        let disablesSkillsFromEnemyAlliesInCombat = false;
        if (enemyUnit) {
            if (enemyUnit.hasStatusEffect(StatusEffectType.Feud) ||
                targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
                disablesSkillsFromEnemyAlliesInCombat = true;
            }
        }
        // enemyAllyにはenemyUnitも含まれる
        for (let enemyAlly of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            let isEnemyAllyNotEnemy = enemyAlly !== enemyUnit;
            if (disablesSkillsFromEnemyAlliesInCombat && isEnemyAllyNotEnemy) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, enemyAlly)) {
                continue;
            }

            for (let skillId of enemyAlly.enumerateSkills()) {
                let func = getSkillFunc(skillId, updateUnitSpurFromEnemyAlliesFuncMap);
                func?.call(this, targetUnit, enemyUnit, enemyAlly, calcPotentialDamage);
            }
            // 縦3列と横3列
            if (Math.abs(targetUnit.posX - enemyAlly.posX) <= 1 ||
                Math.abs(targetUnit.posY - enemyAlly.posY) <= 1) {
                for (let skillId of enemyAlly.enumerateSkills()) {
                    switch (skillId) {
                        case PassiveC.RallyingCry:
                            if (targetUnit.moveType === MoveType.Infantry ||
                                targetUnit.moveType === MoveType.Armor ||
                                targetUnit.moveType === MoveType.Cavalry) {
                                targetUnit.addSpursWithoutAtk(-5);
                            }
                            break;
                        case Weapon.Dreamflake:
                            if (targetUnit.hasNegativeStatusEffect()) {
                                targetUnit.atkSpur -= 5;
                            }
                            break;
                    }
                }
            }
        }

        // 周囲4マス
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 4)) {
            if (disablesSkillsFromEnemyAlliesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HeartOfCrimea:
                        targetUnit.addAllSpur(-4);
                        break;
                }
            }
        }

        // 周囲3マス
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 3)) {
            if (disablesSkillsFromEnemyAlliesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.Syurugu:
                        if (unit.isWeaponSpecialRefined) {
                            // unit: ユルグ
                            // unit(ユルグ)の強化値とtargetUnitの弱化値の大きいほう(弱化はパニック分も含む)
                            // targetUnitとunitが直接戦闘している場合は強化無効が有効になる
                            let atkBuff = 0;
                            let spdBuff = 0;
                            let defBuff = 0;
                            let resBuff = 0;
                            if (enemyUnit !== null && enemyUnit === unit) {
                                atkBuff = unit.getAtkBuffInCombat(targetUnit);
                                spdBuff = unit.getSpdBuffInCombat(targetUnit);
                                defBuff = unit.getDefBuffInCombat(targetUnit);
                                resBuff = unit.getResBuffInCombat(targetUnit);
                            } else {
                                atkBuff = unit.atkBuff * unit.__getBuffMultiply();
                                spdBuff = unit.spdBuff * unit.__getBuffMultiply();
                                defBuff = unit.defBuff * unit.__getBuffMultiply();
                                resBuff = unit.resBuff * unit.__getBuffMultiply();
                            }
                            targetUnit.atkSpur -= Math.max(0, atkBuff, Math.abs(targetUnit.atkDebuffTotal));
                            targetUnit.spdSpur -= Math.max(0, spdBuff, Math.abs(targetUnit.spdDebuffTotal));
                            targetUnit.defSpur -= Math.max(0, defBuff, Math.abs(targetUnit.defDebuffTotal));
                            targetUnit.resSpur -= Math.max(0, resBuff, Math.abs(targetUnit.resDebuffTotal));
                        }
                        break;
                    case Weapon.AchimenesFurl: {
                        let types = new Set();
                        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit)) {
                            types.add(otherUnit.moveType);
                        }
                        if (types.size >= 1) {
                            targetUnit.atkSpur -= 5;
                            targetUnit.defSpur -= 5;
                            targetUnit.resSpur -= 5;
                        }
                    }
                        break;
                    case Weapon.MusuperuNoEnka:
                        if (targetUnit.isWeaponSpecialRefined) {
                            let l = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 3)).length;
                            if (l === 0) break;
                            let amount = Math.min(3, l) * 2;
                            targetUnit.spdSpur -= amount;
                            targetUnit.resSpur -= amount;
                        }
                        break;
                    case Weapon.Gurimowaru:
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur -= 4;
                            targetUnit.spdSpur -= 4;
                            targetUnit.resSpur -= 4;
                        }
                        break;
                    case Weapon.SenhimeNoWakyu:
                        if (unit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur -= 4;
                            targetUnit.spdSpur -= 4;
                            targetUnit.defSpur -= 4;
                        }
                        break;
                    case Weapon.FirstDreamBow:
                        targetUnit.atkSpur -= 4;
                        break;
                    case Weapon.Hlidskjalf:
                        if (unit.isWeaponSpecialRefined) {
                            targetUnit.defSpur -= 3;
                            targetUnit.resSpur -= 3;
                        }
                        break;
                    case PassiveC.AtkSpdHold:
                        targetUnit.addSpurs(-4, -4, 0, 0);
                        break;
                    case PassiveC.AtkDefHold:
                        targetUnit.addSpurs(-4, 0, -4, 0);
                        break;
                    case PassiveC.AtkResHold:
                        targetUnit.addSpurs(-4, 0, 0, -4);
                        break;
                    case PassiveC.SpdDefHold:
                        targetUnit.addSpurs(0, -4, -4, 0);
                        break;
                    case PassiveC.SpdResHold:
                        targetUnit.addSpurs(0, -4, 0, -4);
                        break;
                    case PassiveC.DefResHold:
                        targetUnit.addSpurs(0, 0, -4, -4);
                        break;
                    case Captain.Eminence:
                        targetUnit.addSpurs(0, 0, -3, -3);
                        break;
                }
            }
        }

        // 周囲2マス
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
            if (disablesSkillsFromEnemyAlliesInCombat && (unit !== enemyUnit)) {
                continue;
            }
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(targetUnit, enemyUnit, unit)) {
                continue;
            }
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.ElisesStaff:
                        if (unit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                targetUnit.addAllSpur(-4);
                            }
                        }
                        break;
                    case PassiveC.FettersOfDromi:
                        targetUnit.addAllSpur(-4);
                        break;
                    case Weapon.UnboundBlade:
                    case Weapon.UnboundBladePlus:
                    case Weapon.UnboundLancePlus:
                    case Weapon.UnboundAxePlus:
                    case Weapon.UnboundBow:
                    case Weapon.UnboundBowPlus:
                        if (this.__isSolo(unit)) {
                            targetUnit.atkSpur -= 5;
                            targetUnit.defSpur -= 5;
                        }
                        break;
                    case Weapon.ObsessiveCurse:
                        targetUnit.spdSpur -= 5;
                        targetUnit.resSpur -= 5;
                        break;
                    case Weapon.ReinSword:
                    case Weapon.ReinSwordPlus:
                    case Weapon.ReinLance:
                    case Weapon.ReinLancePlus:
                    case Weapon.ReinAxe:
                    case Weapon.ReinAxePlus:
                    case Weapon.ReinBow:
                    case Weapon.ReinBowPlus:
                        targetUnit.spdSpur -= 4;
                        targetUnit.defSpur -= 4;
                        break;
                    case Weapon.YashiNoKiNoTsuePlus:
                        targetUnit.atkSpur -= 5;
                        targetUnit.spdSpur -= 5;
                        break;
                    case Weapon.CoralBowPlus:
                        targetUnit.spdSpur -= 5;
                        targetUnit.defSpur -= 5;
                        break;
                    case Weapon.FloraGuidPlus:
                        targetUnit.spdSpur -= 5;
                        targetUnit.resSpur -= 5;
                        break;
                    case Weapon.TharjasHex:
                        if (unit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur -= 4;
                            targetUnit.spdSpur -= 4;
                        }
                        break;
                    case PassiveC.AtkSpdRein3:
                    case PassiveC.ASReinSnap:
                        targetUnit.atkSpur -= 4;
                        targetUnit.spdSpur -= 4;
                        break;
                    case PassiveC.AtkDefRein3:
                        targetUnit.atkSpur -= 4;
                        targetUnit.defSpur -= 4;
                        break;
                    case PassiveC.AtkResRein3:
                        targetUnit.atkSpur -= 4;
                        targetUnit.resSpur -= 4;
                        break;
                    case PassiveC.SpdDefRein3:
                    case PassiveC.SDReinSnap:
                        targetUnit.spdSpur -= 4;
                        targetUnit.defSpur -= 4;
                        break;
                    case PassiveC.SpdResRein3:
                        targetUnit.spdSpur -= 4;
                        targetUnit.resSpur -= 4;
                        break;
                    case PassiveC.DefResRein3:
                        targetUnit.defSpur -= 4;
                        targetUnit.resSpur -= 4;
                        break;
                    case PassiveC.InevitableDeath:
                        targetUnit.addAllSpur(-4);
                        break;
                    case PassiveC.InevitableDeathPlus:
                        targetUnit.addAllSpur(-5);
                        break;
                }
            }
        }
    },

    __updateUnitSpurFromAllies(targetUnit, calcPotentialDamage, enemyUnit) {
        if (targetUnit.hasStatusEffect(StatusEffectType.Feud)) {
            return;
        }
        if (enemyUnit && enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat) {
            return;
        }
        for (let ally of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            // 特定の色か確認
            if (enemyUnit && this.__canDisableSkillsFrom(enemyUnit, targetUnit, ally)) {
                continue;
            }
            // 距離に関係ないもの
            for (let skillId of ally.enumerateSkills()) {
                let func = getSkillFunc(skillId, updateUnitSpurFromAlliesFuncMap);
                func?.call(this, targetUnit, ally, enemyUnit, calcPotentialDamage);
                switch (skillId) {
                    case PassiveC.SparklingBoostPlus:
                        if (targetUnit.battleContext.restHpPercentage >= 50) {
                            targetUnit.resSpur += 5;
                        }
                        break;
                    case PassiveC.WingsOfLight:
                        if (targetUnit.isMythicHero
                            && this.currentTurn <= 5
                            && this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.isMythicHero) <= 3
                        ) {
                            targetUnit.addAllSpur(2 + this.currentTurn);
                        }
                        break;
                }
            }

            if (Math.abs(ally.posX - targetUnit.posX) <= 3 && Math.abs(ally.posY - targetUnit.posY) <= 3) {
                // 7×7マス以内にいる場合
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.DaichiBoshiNoBreath: {
                            let amount = ally.isWeaponRefined ? 4 : 2;
                            targetUnit.addAllSpur(amount);
                        }
                            break;
                    }
                }
            }

            if (this.__isNear(ally, targetUnit, 4)) {
                // 4マス以内で発動する戦闘中バフ
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.DivineBreath:
                            if (ally.isWeaponRefined) {
                                if (isWeaponTypeBreath(targetUnit.weaponType) ||
                                    targetUnit.hasEffective(EffectiveType.Dragon)) {
                                    targetUnit.addAllSpur(3);
                                }
                            }
                            break;
                    }
                }
            }

            if (this.__isNear(ally, targetUnit, 3)) {
                // 3マス以内で発動する戦闘中バフ
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.JunaruSenekoNoTsumekiba:
                            if (ally.isWeaponRefined) {
                                targetUnit.addSpurs(4, 4, 0, 0);
                            }
                            break;
                        case Weapon.FirstDreamBow:
                            targetUnit.atkSpur += 4;
                            break;
                        case Weapon.Hlidskjalf:
                            if (ally.isWeaponSpecialRefined) {
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                            }
                            break;
                        case Weapon.GaeBolg:
                            if (ally.isWeaponSpecialRefined) {
                                if (targetUnit.weaponType === WeaponType.Sword ||
                                    targetUnit.weaponType === WeaponType.Lance ||
                                    targetUnit.weaponType === WeaponType.Axe ||
                                    targetUnit.moveType === MoveType.Cavalry
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.defSpur += 5;
                                }
                            }
                            break;
                    }
                }
            }

            if (this.__isNear(ally, targetUnit, 2)) {
                // 2マス以内で発動する戦闘中バフ
                // this.writeDebugLogLine(ally.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                this.__addSpurInRange2(targetUnit, ally, calcPotentialDamage);
            }

            if (this.__isNear(ally, targetUnit, 1)) {
                // 1マス以内で発動する戦闘中バフ
                this.__addSpurInRange1(targetUnit, ally.passiveC, calcPotentialDamage);
                this.__addSpurInRange1(targetUnit, ally.passiveS, calcPotentialDamage);
            }

            if (this.__isInCross(ally, targetUnit)) {
                // 十字方向
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.BondOfTheAlfar:
                            targetUnit.atkSpur += 6;
                            break;
                        case Weapon.FlowerOfJoy:
                            if (!ally.isWeaponRefined) {
                                // <通常効果>
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                            } else {
                                // <錬成効果>
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                            }
                            break;
                        case PassiveC.CrossSpurAtk:
                            targetUnit.atkSpur += 5;
                            break;
                        case PassiveC.CrossSpurRes:
                            targetUnit.resSpur += 5;
                            break;
                    }
                }
            }

            if (this.__isInCrossWithOffset(ally, targetUnit, 1)) {
                for (let skillId of ally.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.ChargingHorn: // 味方にバフ
                            targetUnit.addAtkSpdSpurs(5);
                            if (ally.isWeaponSpecialRefined) {
                                targetUnit.addDefResSpurs(5);
                            }
                            break;
                    }
                }
            }
        }
    },

    __applyPreUpdateUnitSpurSkillEffects(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Captain.AdroitCaptain:
                    targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    break;
                case Weapon.Queensblade:
                    targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    break;
                case Weapon.ShikkyuMyurugure:
                    if (targetUnit.isWeaponRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3) || calcPotentialDamage) {
                            targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                        }
                    }
                    break;
                case PassiveC.ImpenetrableDark:
                case PassiveC.ImpenetrableVoid:
                    targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    break;
                case PassiveC.RedFeud3:
                    if (enemyUnit.color === ColorType.Red) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromRedEnemyAlliesInCombat = true;
                    break;
                case PassiveC.BlueFeud3:
                    if (enemyUnit.color === ColorType.Blue) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromBlueEnemyAlliesInCombat = true;
                    break;
                case PassiveC.GreenFeud3:
                    if (enemyUnit.color === ColorType.Green) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromGreenEnemyAlliesInCombat = true;
                    break;
                case PassiveC.CFeud3:
                    if (enemyUnit.color === ColorType.Colorless) {
                        targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
                    }
                    targetUnit.battleContext.disablesSkillsFromColorlessEnemyAlliesInCombat = true;
                    break;
            }
        }
    },
});
