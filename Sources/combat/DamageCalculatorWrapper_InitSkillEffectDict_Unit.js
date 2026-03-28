if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    __init__applySkillEffectForUnitFuncDict() {
        let self = this;
        // this._applySkillEffectForUnitFuncDict[Weapon.W] = (targetUnit, enemyUnit, calcPotentialDamage) => {
        this._applySkillEffectForUnitFuncDict[Weapon.PaydayPouch] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let amount = Math.min(Math.max(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8, 0), 10);
                targetUnit.addAtkSpdSpurs(amount);
                if (targetUnit.getPositiveStatusEffects().length >= 3) {
                    targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PumpkinStemPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                        let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units);
                        targetUnit.addSpurs(...amounts);
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DazzleFarTrace] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KittyCatParasol] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkResSpurs(6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.BonusDoubler4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            let hasPositiveStatusEffect = targetUnit.hasPositiveStatusEffect(enemyUnit);
            if (!hasPositiveStatusEffect) {
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                    if (unit.hasPositiveStatusEffect()) {
                        hasPositiveStatusEffect = true;
                        break;
                    }
                }
            }
            if (hasPositiveStatusEffect) {
                targetUnit.addAllSpur(4);
            }
            targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                    let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units, true);
                    targetUnit.addSpurs(...amounts);
                }
            );
        }
        this._applySkillEffectForUnitFuncDict[Weapon.InspiritedSpear] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getEvalDefInPrecombat() * 0.15);
                enemyUnit.addSpursWithoutRes(-amount);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    let amount = targetUnit.getDefInCombat(enemyUnit) * 0.4;
                    targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(amount);
                });
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AerialManeuvers] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 50 &&
                enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.addSpdDefSpurs(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AbsoluteAmiti] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                let amount = enemyUnit.special === Special.None ? 3 : 11 - enemyUnit.maxSpecialCount * 2;
                targetUnit.addAtkSpdSpurs(Math.max(amount, 3));
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeiredGungnir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    // ステータスの20%(奥義含む。含まない場合はisPrecombatで条件わけする)
                    // if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getDef(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                });
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MiasmaDaggerPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs.push(
                    (attackUnit, attackTargetUnit) => {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.reserveTakeDamage(7);
                        }
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeiredYewfelle] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let enemyAtk = enemyUnit.getAtkInPrecombat();
                targetUnit.addAtkSpdSpurs(Math.max(Math.min(Math.trunc(enemyAtk * 0.25 - 8), 10), 0));
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeiredForseti] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneEuphoria] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                });
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GeneiFalcion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HelsReaper] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                // 1戦闘1回まで
                if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                    return false;
                }
                if (!isWeaponTypeTome(atkUnit.weaponType) &&
                    atkUnit.weaponType !== WeaponType.Staff) {
                    return true;
                }
                return false;
            });
            if (targetUnit.isWeaponRefined) {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            if (targetUnit.battleContext.restHpPercentage >= 25 || enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    );
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (atkUnit.battleContext.restHpPercentage >= 25 || defUnit.hasNegativeStatusEffect()) {
                            let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                        }
                    });
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            if (targetUnit.battleContext.restHpPercentage >= 25 || enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                            }
                        }
                    );
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DisarmTrap4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BrightwindFans] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = targetUnit.getSpdInPrecombat();
                targetUnit.addAtkSpdSpurs(amount);
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                if (targetUnit.battleContext.initiatesCombat) {
                    // 最初に受けた攻撃のダメージを軽減
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                    // ダメージ軽減分を保存
                    // 攻撃ごとの固定ダメージに軽減した分を加算
                    targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WindTribeClubPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkDefSpurs(5);
                let positiveCount = targetUnit.getPositiveStatusEffects().length;
                let amount = positiveCount + enemyUnit.getNegativeStatusEffects().length;
                targetUnit.addAtkDefSpurs(amount * 2);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WhitewindBowPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                let positiveCount = targetUnit.getPositiveStatusEffects().length;
                let amount = positiveCount + enemyUnit.getNegativeStatusEffects().length;
                targetUnit.addAtkSpdSpurs(amount * 2);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.TwinSkyWing] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpdDefSpurs(-5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FujinUchiwa] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
            targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    targetUnit.atkSpur += Math.max(targetUnit.getAtkBuffInCombat(enemyUnit), enemyUnit.getAtkBuffInCombat(targetUnit));
                    targetUnit.spdSpur += Math.max(targetUnit.getSpdBuffInCombat(enemyUnit), enemyUnit.getSpdBuffInCombat(targetUnit));
                    targetUnit.defSpur += Math.max(targetUnit.getDefBuffInCombat(enemyUnit), enemyUnit.getDefBuffInCombat(targetUnit));
                    targetUnit.resSpur += Math.max(targetUnit.getResBuffInCombat(enemyUnit), enemyUnit.getResBuffInCombat(targetUnit));

                    enemyUnit.atkSpur -= Math.max(enemyUnit.getAtkBuffInCombat(targetUnit, 0));
                    enemyUnit.spdSpur -= Math.max(enemyUnit.getSpdBuffInCombat(targetUnit, 0));
                    enemyUnit.defSpur -= Math.max(enemyUnit.getDefBuffInCombat(targetUnit, 0));
                    enemyUnit.resSpur -= Math.max(enemyUnit.getResBuffInCombat(targetUnit, 0));
                }
            );
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            targetUnit.battleContext.increaseCooldownCountForBoth();
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DeepStar] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addSpdDefSpurs(-5);
                let ratio = targetUnit.battleContext.initiatesCombat ? 0.8 : 0.3;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(ratio, enemyUnit);
            }
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.applySkillEffectAfterCombatForUnitFuncs.push(
                    (targetUnit, enemyUnit) => {
                        targetUnit.reserveToAddStatusEffect(StatusEffectType.DeepStar);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 1, true)) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PlayfulPinwheel] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let positiveCount = targetUnit.getPositiveStatusEffects().length;
                let amount = positiveCount + enemyUnit.getNegativeStatusEffects().length;
                targetUnit.addAtkSpdSpurs(amount * 2);
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += Math.min(positiveCount, targetUnit.battleContext.specialCount);
                targetUnit.battleContext.specialCountReductionBeforeFollowupAttack += Math.max(positiveCount - targetUnit.battleContext.specialCount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AptitudeArrow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(Math.min(Math.trunc(targetUnit.level), 10));
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.2);
                });
                targetUnit.battleContext.invalidateAllOwnDebuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.InevitableDeathPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            );
        }
        this._applySkillEffectForUnitFuncDict[Special.DragonBlast] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3, unit => unit.isPartner(targetUnit))) {
                targetUnit.battleContext.specialSkillCondSatisfied = true;
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (targetUnit.isPartner(unit)) {
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DragonsFist] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                let amount = Math.min(Unit.getTitleSet(units).size * 3 + 4, 10);
                enemyUnit.addAllSpur(-amount);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.TipTheScales] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.addAllSpur(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.Gambit4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
            targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                if (isPrecombat) return;
                if (isNormalAttackSpecial(atkUnit.special) ||
                    isDefenseSpecial(atkUnit.special)) {
                    let amount = Math.max(Math.min((atkUnit.maxSpecialCount - 2) * 5, 15), 0);
                    atkUnit.battleContext.additionalDamage += amount;
                }
            });
            targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                return Math.min(defUnit.maxSpecialCount * 0.1, 0.5);
            });
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.GoldUnwinding] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdResSpurs(-5);
            if (targetUnit.battleContext.restHpPercentage >= 50 &&
                targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.6, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RareTalent] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(7);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let d = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                        if (d >= 1) {
                            targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                                (targetUnit, enemyUnit, calcPotentialDamage) => {
                                    enemyUnit.battleContext.reducesCooldownCount = false;
                                }
                            );
                        }
                        if (d >= 10) {
                            if (targetUnit.battleContext.initiatesCombat ||
                                isRangedWeaponType(enemyUnit.weaponType)) {
                                targetUnit.battleContext.setAttackCountFuncs.push(
                                    (targetUnit, enemyUnit) => {
                                        // 攻撃時
                                        targetUnit.battleContext.attackCount = 2;
                                        // 攻撃を受けた時
                                        targetUnit.battleContext.counterattackCount = 2;
                                    }
                                );
                            }
                        }
                    }
                );
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.CounterRoar4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addAtkSpdSpurs(-4);
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.3, enemyUnit);
            targetUnit.battleContext.reducedRatioForNextAttack = Math.max(0.3, targetUnit.battleContext.reducedRatioForNextAttack);
            targetUnit.battleContext.healedHpAfterCombat += 7;
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RealmsUnited] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAllSpur(-7);
                targetUnit.battleContext.damageReductionValueOfFirstAttacks += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ThraciaKinglance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
                let def = targetUnit.getDefInPrecombat();
                enemyUnit.atkSpur -= Math.trunc(def * 0.15);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WesternAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(4);
                // 最初に受けた攻撃のダメージを軽減
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(30 / 100.0, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                        }
                    );
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShirejiaNoKaze] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAtkSpdSpurs(6);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.addAtkSpdSpurs(6);
                    let spd = targetUnit.getSpdInPrecombat();
                    let amount = Math.trunc(spd * 0.2);
                    enemyUnit.addSpdResSpurs(-amount);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAtkSpdSpurs(5);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NightmareHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TeacakeTowerPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TeatimesEdge] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                let amount = Math.max(Math.min(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8, 10), 0);
                targetUnit.addAtkSpdSpurs(amount);

            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TeatimeSetPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkSpdSpurs(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KnightlyManner] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.Desperation4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.Mastermind] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkSpdSpurs(9);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BakedTreats] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.invalidateBuffs(false, true, false, true);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BindingNecklacePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat ||
                this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAllSpur(3);
                enemyUnit.addAllSpur(-3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.HolyWarsEnd2] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.DreamDeliverer] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addDefResSpurs(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DreamHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PackleaderTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpursWithoutDef(-5);
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BeastSense4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.PowerOfNihility] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAllSpur(9);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                let ratio = Math.min(0.1 + targetUnit.maxSpecialCount * 0.2, 1.0);
                targetUnit.battleContext.maxHpRatioToHealBySpecial += ratio;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.GetBehindMe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addSpdDefSpurs(-5);
                let amount = Math.trunc(enemyUnit.getDefInPrecombat() * 0.3);
                enemyUnit.defSpur -= amount;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.FlashSparrow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addAtkSpdSpurs(7);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneDarkbow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfLaxuries] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FairFightBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecial = true;
                enemyUnit.battleContext.invalidatesDamageReductionExceptSpecial = true;
                // TODO: "自分と敵は"の条件がどこまでかかるのか確認する
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                enemyUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += 20;
                enemyUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += 20;
            }
            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
            }
            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.healedHpAfterAttackSpecialInCombat = 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FathersSonAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、戦闘中、敵の攻撃、守備-5、
                // 自分が与えるダメージ + 戦闘開始時の自分のHPの15 % (戦闘前奥義も含む)、戦闘後、自分は、7回復
                if (targetUnit.battleContext.weaponSkillCondSatisfied || targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    enemyUnit.addAtkDefSpurs(-5, -5);
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneNihility] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DokuNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DesertTigerAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VoidTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                    if (enemyUnit.special !== Special.None && !enemyUnit.isSpecialCountMax) {
                        targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WoodenTacklePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkDefSpurs(5);
                let amount = Math.min(Math.trunc(targetUnit.restHp * 0.25), 10);
                enemyUnit.addAtkDefSpurs(-amount);
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SparklingSun] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                enemyUnit.addAtkResSpurs(-6);
                let amount = Math.min(Math.trunc(targetUnit.restHp * 0.30), 12);
                enemyUnit.addAtkResSpurs(-amount);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeashellBowlPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                let amount = Math.min(Math.trunc(targetUnit.restHp * 0.25), 10);
                enemyUnit.addAtkSpdSpurs(-amount);
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
        this._applySkillEffectForUnitFuncDict[Special.FrostbiteMirror] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.specialCount === 0) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IceBoundBrand] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                // TODO: 表示上限の99を超えた時にどうなるか確認する
                let spd = targetUnit.getSpdInPrecombat();
                let amount = Math.trunc(spd * 0.2);
                enemyUnit.addAtkSpdSpurs(-amount);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DivineDraught] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let condA = targetUnit.battleContext.initiatesCombat;
                let condB = this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, unit => targetUnit.isPartner(unit));
                let condC = enemyUnit.hasNegativeStatusEffect();
                let num = [condA, condB, condC].filter(c => c).length;
                targetUnit.battleContext.condValueMap.set("num_cond", num);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.ImpenetrableVoid] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addAllSpur(-5);
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.BernsNewWay] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.healedHpAfterCombat = 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.NullCDisrupt4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addAtkSpdSpurs(-4);
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RadiantAureola] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BrashAssault4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if ((targetUnit.battleContext.restHpPercentage <= 99 && targetUnit.battleContext.initiatesCombat) ||
                (enemyUnit.battleContext.restHpPercentage === 100 && targetUnit.battleContext.initiatesCombat)) {
                enemyUnit.addDefResSpurs(-4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.reducedRatioForNextAttack =
                    Math.max(0.3, targetUnit.battleContext.reducedRatioForNextAttack);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PartnershipBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = enemyUnit.getPositiveStatusEffects().length + enemyUnit.getNegativeStatusEffects().length;
                let amount = Math.min(count * 4, 16);
                enemyUnit.addSpdDefSpurs(-amount);
                if (count > 0) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SunlightBangle] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                if (targetUnit.battleContext.initiatesCombat) {
                    enemyUnit.battleContext.isVantageActivatable = true;
                }
                enemyUnit.addAtkDefSpurs(-4);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4);
                enemyUnit.addAtkDefSpurs(-amount);
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeafoamSplitter] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Kvasir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.7, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SyugosyaNoRekkyu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat ||
                    targetUnit.getSpdInPrecombat() >= enemyUnit.getSpdInPrecombat() - 7) {
                    enemyUnit.addSpursWithoutRes(-5);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateBuffs(false, true, true, false);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VioldrakeBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.refersMinOfDefOrRes = true;
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EtherealBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addAtkResSpurs(-5);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addAtkResSpurs(-5);
                        enemyUnit.invalidatesOwnDefDebuff = true;
                        enemyUnit.invalidatesOwnResDebuff = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IncurablePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.battleContext.hasDeepWounds = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WyvernHatchet] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Heidr] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GoldenCurse] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IlianMercLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.MagNullFollow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdResSpurs(-4);
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.PhysNullFollow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VassalSaintSteel] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount;
                if (enemyUnit.special === Special.None) {
                    amount = 3;
                } else {
                    amount = Math.max(11 - enemyUnit.maxSpecialCount * 2, 3);
                }
                enemyUnit.addSpdDefSpurs(-amount);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.WingsOfMercy4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addDefResSpurs(-3);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FujinRaijinYumi] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TwinDivinestone] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.RingOfAffiancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BridalBladePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ChonsinSprig] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let tmp = Math.max(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8, 0);
                let amount = Math.min(tmp, 10);
                enemyUnit.addSpdDefSpurs(-amount);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeartbrokerBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let amount = Math.min(targetUnit.dragonflower, 5);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FreebladesEdge] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PupilsTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || isRangedWeaponType(enemyUnit.weaponType)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    let amount = Math.trunc(targetUnit.getResInPrecombat() * 0.2);
                    enemyUnit.addAtkResSpurs(-amount);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RevengerLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ValbarsLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAtkDefSpurs(5);
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.6, enemyUnit);
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAtkDefSpurs(5);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.RagingStorm2] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 || this.__isSolo(targetUnit) || calcPotentialDamage) {
                enemyUnit.addAtkDefSpurs(-5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                let weaponType = enemyUnit.weaponType;
                if (weaponType === WeaponType.Breath || weaponType === WeaponType.Beast) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DeadFangAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneDevourer] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SilentBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.damageReductionValueOfFirstAttacks += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SacrificeStaff] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.DistantASSolo] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addAtkSpdSpurs(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CaptainsSword] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidateAllBuffs();
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AlarmAtkSpd] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAtkSpdSpurs(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AlarmAtkDef] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addAtkDefSpurs(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AlarmSpdDef] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addSpdDefSpurs(3);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FruitOfLife] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpdDefSpurs(-5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
                if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.battleContext.passiveBSkillCondSatisfied = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Asclepius] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkResSpurs(6);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.GuardBearing4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            enemyUnit.addSpdDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.KnightlyDevotion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(8);
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneLuin] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidateBuffs(false, true, true, false);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RevealingBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LoneWolf] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                if (this.__isSolo(targetUnit)) {
                    enemyUnit.addSpursWithoutRes(-5);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MaskedLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                let res = targetUnit.getResInPrecombat();
                let amount = Math.trunc(res * 0.2);
                enemyUnit.addSpursWithoutSpd(-amount);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WizenedBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                if (!enemyUnit.battleContext.invalidatesOwnAtkDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.atkDebuffTotal), 0);
                    enemyUnit.atkSpur -= amount;
                }
                if (!enemyUnit.battleContext.invalidatesOwnSpdDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.spdDebuffTotal), 0);
                    enemyUnit.spdSpur -= amount;
                }
                if (!enemyUnit.battleContext.invalidatesOwnDefDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.defDebuffTotal), 0);
                    enemyUnit.defSpur -= amount;
                }
                if (!enemyUnit.battleContext.invalidatesOwnResDebuff) {
                    let amount = Math.max(6 - Math.abs(enemyUnit.resDebuffTotal), 0);
                    enemyUnit.resSpur -= amount;
                }
                enemyUnit.addAllSpur(-6);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StaffOfLilies] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HadoNoSenfu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25 ||
                    this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || this.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MysticWarStaff] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAtkResSpurs(6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TotalWarTome] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAllSpur(-5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GustyWarBow] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
                if (isWeaponTypeBeast(enemyUnit.weaponType) ||
                    (isRangedWeaponType(enemyUnit.weaponType) &&
                        (enemyUnit.moveType === MoveType.Cavalry || enemyUnit.moveType === MoveType.Flying))) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.6, enemyUnit);
                } else {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FieryWarSword] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let amount = Math.min(targetUnit.getPositiveStatusEffects().length * 3, 12);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.OstiasHeart] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAtkDefSpurs(-8);
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ValiantWarAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-6);
                targetUnit.battleContext.reducesCooldownCount = true;
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    let count = enemyUnit.maxSpecialCount === 0 ? 4 : enemyUnit.maxSpecialCount;
                    let amount = Math.max(12 - count * 2, 4);
                    enemyUnit.atkSpur -= amount;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdHexblade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                targetUnit.addAtkSpdSpurs(7);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdResHexblade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                targetUnit.addSpdResSpurs(7);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AbyssalBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SoaringWings] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpdDefSpurs(-4);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4);
                enemyUnit.addSpdDefSpurs(-amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneNastrond] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let specialCount = enemyUnit.special === Special.None ? 4 : enemyUnit.maxSpecialCount;
                let amount = Math.max(12 - specialCount * 2, 4);
                targetUnit.atkSpur += amount;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrelianBlade] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.15);
                enemyUnit.addSpursWithoutRes(-amount);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.VengefulFighter4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                enemyUnit.atkSpur -= 4;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrelianLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                let amount = Math.trunc(targetUnit.getEvalDefInPrecombat() * 0.2);
                enemyUnit.atkSpur -= amount;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Merikuru] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenteiNoKen] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NewFoxkitFang] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        if (targetUnit.isTransformed) {
                            enemyUnit.addAllSpur(-4);
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenseiAngel] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAtkSpdSpurs(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAtkSpdSpurs(5);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.AsherasChosen] = (targetUnit, _enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || this.__isThereAllyExceptDragonAndBeastWithin1Space(targetUnit) === false) {
                targetUnit.atkSpur += 6;
                targetUnit.defSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.AsherasChosenPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage ||
                this.__isThereAllyExceptDragonAndBeastWithin1Space(targetUnit) === false ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(9, 0, 9, 9);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DaichiBoshiNoBreath] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                let count = 0;
                for (let unit of self.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    // in 7x7
                    if (Math.abs(targetUnit.posX - unit.posX) <= 3 &&
                        Math.abs(targetUnit.posY - unit.posY) <= 3) {
                        count++;
                    }
                }
                let amount = Math.min(count, 6);
                targetUnit.addAllSpur(amount);
                if (targetUnit.isWeaponSpecialRefined && count >= 1) {
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HaresLancePlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkDefSpurs(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SisterlyWarAxe] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAtkSpdSpurs(6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BunnysEggPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NightmaresEgg] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.EscapeRoute4] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkSpdSpurs(-3);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfRepose] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.addAllSpur(5);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4) * 2 + 3;
                enemyUnit.addSpdDefSpurs(-amount);
                if (dist >= 1) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                if (dist >= 2) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SoulOfZofia2] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.spdSpur -= 5;
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.PartOfThePlan] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-8, -8, 0, -8);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MatersTactics] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, -5, 0, -5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        // 回避4
        {
            let func = (targetUnit, enemyUnit) => {
                enemyUnit.addSpurs(0, -4, -4, 0);
            };
            this._applySkillEffectForUnitFuncDict[PassiveB.Spurn4] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.CloseCall4] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.Repel4] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HornOfTheLand] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = targetUnit.maxSpecialCount * 2;
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DazzlingShift] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrimeanScepter] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GronndeerPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Queenslance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Queensblade] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
            targetUnit.battleContext.preventedAttackerSpecial = true;
            enemyUnit.battleContext.preventedAttackerSpecial = true;

            targetUnit.battleContext.preventedDefenderSpecial = true;
            enemyUnit.battleContext.preventedDefenderSpecial = true;

            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            enemyUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;

            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            enemyUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NewBrazenCatFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CommandLance] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
                    let amount = Math.min(count * 2, 6);
                    targetUnit.addAllSpur(amount);
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AstraBlade] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage = 0.5;
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                        let amount = Math.min(dist, 4) * 2;
                        targetUnit.atkSpur += amount;
                        enemyUnit.defSpur -= amount;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.VolunteerBow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                if (isRangedWeaponType(enemyUnit.weaponType)) {
                    enemyUnit.addSpurs(-5, -5, 0, 0);
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KouketsuNoSensou] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if ((targetUnit.battleContext.restHpPercentage === 100 && enemyUnit.battleContext.restHpPercentage === 100) ||
                    (targetUnit.battleContext.restHpPercentage < 100 && enemyUnit.battleContext.restHpPercentage < 100)) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage <= 99 || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerOfJoy] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                let found = false;
                for (let unit of self.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (unit.posX === targetUnit.posX ||
                        unit.posY === targetUnit.posY) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.PoeticJustice] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DuskDawnStaff] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.PetalfallBladePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.PetalfallVasePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DuskbloomBow] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DawnsweetBox] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let atk = targetUnit.getAtkInPrecombat();
                let func = unit => unit.getAtkInPrecombat() >= atk - 4;
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, func);
                let amount = Math.min(count * 3 + 4, 10);
                enemyUnit.addSpurs(-amount, -amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.GiftOfMagic] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || isRangedWeaponType(enemyUnit.weaponType)) {
                enemyUnit.addSpurs(-10, 0, 0, -10);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BrilliantStarlight] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, 0, -6);
                targetUnit.battleContext.invalidateBuffs(true, false, false, true);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.BeastFollowUp3] = (targetUnit) => {
            targetUnit.battleContext.followupAttackPriorityIncrement++;
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.Nightmare] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addSpurs(-10, 0, -10, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Ravager] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, -6, 0);
                targetUnit.battleContext.reducesCooldownCount = true;
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.8, enemyUnit);
                }
            }
            if (targetUnit.isTransformed) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MonarchBlade] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(5, 0, 5, 0);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionEdgePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionPikePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ProtectionBowPlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Liberation] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let units = self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                let amount = Math.min(Unit.getTitleSet(units).size * 4 + 4, 12);
                enemyUnit.addSpurs(0, -amount, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.PegasusFlight4] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(-4, 0, -4, 0);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DreamingSpear] = (targetUnit) => {
            let units = Array.from(this.enumerateUnitsInTheSameGroupOnMap(targetUnit));
            let partners = units.map(u => u.partnerHeroIndex);
            if (units.some(u => partners.includes(u.heroIndex))) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JoyousTome] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.healedHpAfterCombat = 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SelfImprover] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneQiang] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                if (dist !== 0) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KokkiNoKosou] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                        let amount = Math.min(dist, 3) * 2;
                        targetUnit.addAllSpur(amount);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BouryakuNoSenkyu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MasterBow] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RagnellAlondite] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 0, 0, 5);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MagicalLanternPlus] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 0, 5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RemoteSparrow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addSpurs(7, 7, 0, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RemoteSturdy] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addSpurs(7, 0, 10, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.RemoteMirror] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addSpurs(7, 0, 0, 10);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CelestialGlobe] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GuidesHourglass] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrowsCrystal] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ChildsCompass] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = targetUnit.getPositiveStatusEffects().length
                let amount = Math.min(count * 4, 16);
                targetUnit.addSpurs(amount, amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WaryRabbitFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
                let amount = Math.trunc(targetUnit.getSpdInCombat(enemyUnit) * 0.2);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DualityVessel] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KeenRabbitFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FangOfFinality] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeraldingHorn] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
            }
            let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
            if (count >= 2) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
            if (count >= 3) {
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.SwiftSlice] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(8);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PeppyCanePlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, 0, -5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.InseverableSpear] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PeppyBowPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, -5, 0);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SevenfoldGifts] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SolemnAxe] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                if (isNormalAttackSpecial(targetUnit.special)) {
                    let percentage = enemyUnit.battleContext.restHpPercentage;
                    if (percentage >= 20) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    }
                    if (percentage >= 40) {
                        let atk = enemyUnit.getAtkInPrecombat();
                        let amount = Math.max(Math.min(Math.trunc(atk * 0.25) - 8, 10), 0);
                        enemyUnit.addSpurs(-amount, -amount, 0, 0);
                    }
                    if (percentage >= 60) {
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Aurgelmir] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShintakuNoBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.isBuffedInCombat(enemyUnit)) {
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.addAllSpur(4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        let atk = 0;
                        let spd = 0;
                        let def = 0;
                        let res = 0;
                        for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                            if (!unit.hasStatusEffect(StatusEffectType.Panic)) {
                                atk = Math.max(atk, unit.atkBuff);
                                spd = Math.max(spd, unit.spdBuff);
                                def = Math.max(def, unit.defBuff);
                                res = Math.max(res, unit.resBuff);
                            }
                        }
                        targetUnit.atkSpur += atk;
                        targetUnit.spdSpur += spd;
                        targetUnit.defSpur += def;
                        targetUnit.resSpur += res;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RetainersReport] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ReginRave] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Seidr] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ProdigyPolearm] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                let count = 0;
                if (targetUnit.maxHp <= enemyUnit.maxHp + 5) {
                    count++;
                }
                if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() + 5) {
                    count++;
                }
                if (targetUnit.getSpdInPrecombat() <= enemyUnit.getSpdInPrecombat() + 5) {
                    count++;
                }
                if (targetUnit.getDefInPrecombat() <= enemyUnit.getDefInPrecombat() + 5) {
                    count++;
                }
                if (targetUnit.getResInPrecombat() <= enemyUnit.getResInPrecombat() + 5) {
                    count++;
                }
                let percentage = count * 5 + 10;
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * percentage / 100.0);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpecialSpiral4] = (targetUnit) => {
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneEclipse] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AllTogether] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
            }
            let count = 0;
            for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                count++;
            }
            let percentage = Math.min(count * 20, 40);
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AwokenBreath] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CoyotesLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                let amount = Math.min(Unit.calcAttackerMoveDistance(targetUnit, enemyUnit), 3) * 3;
                targetUnit.addSpurs(amount, amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.QuickRiposte4] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.25, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneDownfall] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LanceOfHeroics] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                let amount = Math.min(dist, 4) * 2;
                targetUnit.addAllSpur(amount);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }

        this._applySkillEffectForUnitFuncDict[Weapon.SnideBow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 5, 0, 0);
                targetUnit.battleContext.additionalDamage += 7;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    enemyUnit.addSpurs(0, -5, -5, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ChaosManifest] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(5, 0, 0, 5);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArdentDurandal] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealAtk4] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealSpd4] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealDef4] = (targetUnit, enemyUnit) => {
            enemyUnit.defSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SealRes4] = (targetUnit, enemyUnit) => {
            enemyUnit.resSpur -= 4;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.defSpur += 5;
                    enemyUnit.defSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersSwordPlus] = func
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersLancePlus] = func
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersBowPlus] = func
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.MysticBoost4] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 5;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.YmirEverliving] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || isRangedWeaponType(enemyUnit.weaponType)) {
                targetUnit.addAllSpur(5);
                let hps = [];
                for (let unit of self.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    hps.push(unit.battleContext.restHp);
                }
                hps.sort();
                let amount;
                if (hps.length <= 1) {
                    amount = 0;
                } else {
                    hps = hps.filter((elem, index, self) => self.indexOf(elem) === index);
                    if (hps.length === 1) {
                        hps.push(hps[0]);
                    }
                    amount = Math.min(Math.trunc(hps[1] * 0.4), 20);
                }
                targetUnit.atkSpur += amount;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                    // 1戦闘1回まで
                    if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                        return false;
                    }
                    if (defUnit.battleContext.initiatesCombat || isRangedWeaponType(atkUnit.weaponType)) {
                        if (defUnit.restHpPercentage >= 25) {
                            return true;
                        }
                    }
                    return false;
                });
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BladeOfFavors] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addSpurs(-5, -5, -5, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.Dragonhide] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addAllSpur(-8);
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneGrima] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TaguelChildFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                // <錬成効果>
                if (self.__isSolo(targetUnit) || calcPotentialDamage || targetUnit.battleContext.restHpPercentage <= 90) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BrazenCatFang] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || (self.__isSolo(targetUnit) || calcPotentialDamage)) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.additionalDamageOfSpecial += 10;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ZekkaiNoSoukyu] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat && enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RazingBreath] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SurpriseBreathPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 0, 5);
                let amount = Math.trunc(targetUnit.getResInPrecombat() * 0.2);
                enemyUnit.addSpurs(-amount, 0, 0, -amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GhostlyLanterns] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StarlightStone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.addSpurs(-5, 0, 0, -5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StarlightStone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonlightStone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WarriorsSword] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrimsonWarAxe] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
            let hpPercentage = targetUnit.battleContext.restHpPercentage;
            if (hpPercentage >= 20) {
                enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                enemyUnit.battleContext.increaseCooldownCountForDefense = false;
            }
            if (hpPercentage >= 40) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FumingFreikugel] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            let isThereHigherDefAlly = self.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                unit => targetUnit.getDefInPrecombat() < unit.getDefInPrecombat());
            if (!isThereHigherDefAlly || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WindGenesis] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
                let amount = 11 - Math.max(enemyUnit.maxSpecialCount, 3) * 2;
                enemyUnit.addSpurs(-amount, -amount, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CrimsonBlades] = (targetUnit, enemyUnit) => {
            let hpPercentage = targetUnit.battleContext.restHpPercentage;
            if (hpPercentage >= 20) {
                enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                enemyUnit.battleContext.increaseCooldownCountForDefense = false;
            }
            if (hpPercentage >= 40) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArcaneEljudnir] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, -6, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TempestsClaw] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeTome(enemyUnit.weaponType) && enemyUnit.color === ColorType.Blue) {
                enemyUnit.battleContext.isEffectiveToOpponent = true;
            }
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 5, 0);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenteiNoHado] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FieryFang] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 0, 6, 0);
                let amount = Math.trunc(targetUnit.getDefInPrecombat() * 0.2);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KindlingTaiko] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                if (targetUnit.battleContext.initiatesCombat) {
                    if (enemyUnit.color !== ColorType.Red) {
                        targetUnit.atkSpur += Math.trunc(targetUnit.getAtkInPrecombat() * 0.2);
                        enemyUnit.atkSpur -= Math.trunc(enemyUnit.getAtkInPrecombat() * 0.2);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrameGunbaiPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 5, 0);
                let amount = Math.trunc(targetUnit.getDefInPrecombat() * 0.2);
                enemyUnit.addSpurs(-amount, 0, -amount, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BreathOfFlame] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveA.VerdictOfSacae] = (targetUnit) => {
            let count = 0;
            for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 4)) {
                count++;
            }
            if (count >= 1) {
                targetUnit.battleContext.passiveASkillCondSatisfied = true;
                let amount = Math.min(count * 4 + 4, 12);
                targetUnit.addAllSpur(amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FirelightLance] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BreakerLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-6, 0, -6, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.NewDivinity] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, 0, -5);
            }
            if (targetUnit.battleContext.restHpPercentage >= 40) {
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        {
            // 激突3, 4
            let getFunc = (spurFunc, skillLevel, debuffFlags) => {
                return (targetUnit, enemyUnit) => {
                    let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                    if (dist > 0) {
                        let amount = 0;
                        let distLimit = 0;
                        switch (skillLevel) {
                            case 4:
                                amount = 6;
                                distLimit = 4;
                                break;
                            case 3:
                                amount = 5;
                                distLimit = 3;
                                break;
                        }
                        spurFunc.call(targetUnit, amount);
                        spurFunc.call(targetUnit, Math.min(dist, distLimit));
                        if (skillLevel === 4 && dist >= 2) {
                            targetUnit.battleContext.invalidateOwnDebuffs(...debuffFlags);
                        }
                    }
                }
            }
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdClash3] =
                getFunc(Unit.prototype.addAtkSpdSpurs, 3, [true, true, false, false]);
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdClash4] =
                getFunc(Unit.prototype.addAtkSpdSpurs, 4, [true, true, false, false]);

            this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefClash3] =
                getFunc(Unit.prototype.addAtkDefSpurs, 3, [true, false, true, false]);
            this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefClash4] =
                getFunc(Unit.prototype.addAtkDefSpurs, 4, [true, false, true, false]);

            this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefClash3] =
                getFunc(Unit.prototype.addSpdDefSpurs, 3, [false, true, true, false]);
            this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefClash4] =
                getFunc(Unit.prototype.addSpdDefSpurs, 4, [false, true, true, false]);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdPreempt3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 4;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WandererBlade] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JinroOuNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.addSpurs(-5, 0, -5, 0);
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.YonkaiNoSaiki] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShishiouNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.7, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.addSpurs(-5, 0, -5, 0);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        if (targetUnit.isTransformed) {
                            let amount = Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25) - 8;
                            if (amount >= 0) {
                                amount = Math.min(10, amount);
                                targetUnit.addSpurs(amount, 0, amount, amount);
                            }
                        }
                    }
                }
            }
            if (targetUnit.isTransformed) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LunaArc] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FloridCanePlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShadowyQuill] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.battleContext.refersMinOfDefOrRes = true;
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FloridKnifePlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SoothingScent] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LoftyLeaflet] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkSpdBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkSpdSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdDefSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResBulwark3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdResSpurs(-4);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EverlivingBreath] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TriEdgeLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.weaponSkillCondSatisfied = true;
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MilasTestament] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                    // 1戦闘1回まで
                    if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                        return false;
                    }
                    return defUnit.restHpPercentage >= 25;
                });
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeartbeatLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, 0, -5, 0);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addSpurs(-5, 0, -5, 0);
                        let amounts = [
                            targetUnit.maxHp - enemyUnit.maxHp,
                            targetUnit.getAtkInPrecombat() - enemyUnit.getAtkInPrecombat(),
                            targetUnit.getSpdInPrecombat() - enemyUnit.getSpdInPrecombat(),
                            targetUnit.getDefInPrecombat() - enemyUnit.getDefInPrecombat(),
                            targetUnit.getResInPrecombat() - enemyUnit.getResInPrecombat(),
                        ];
                        let count = amounts.filter(x => x > 1).length;
                        let spur = Math.trunc(enemyUnit.getAtkInPrecombat() * (count * 5 + 10) / 100.0);
                        enemyUnit.atkSpur -= spur;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AnkokuNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        if (enemyUnit.getSpdInPrecombat() >= enemyUnit.getEvalDefInPrecombat() + 1) {
                            enemyUnit.spdSpur -= 8;
                        } else {
                            enemyUnit.defSpur -= 8;
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TrasenshiNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 0, 5, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addSpurs(5, 0, 5, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MaryuHuinNoKen] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Gjallarbru] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(4, 4, 0, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DivineWhimsy] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CoralSaberPlus] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 5, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeahouseAxePlus] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(5, 0, 5, 0);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }

        this._applySkillEffectForUnitFuncDict[Weapon.ChilledBreath] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AtkSpdOath4] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(3, 3, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AtkResOath4] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(3, 0, 0, 3);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CaringConch] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.Chivalry] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.addSpurs(-5, -5, -5, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WhitecapBowPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RegalSunshade] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FrozenDelight] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonlightDrop] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 0, 0, 6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.UnyieldingOar] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JinroMusumeNoTsumekiba] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JunaruSenekoNoTsumekiba] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        let count = 0;
                        for (let _ of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                            count++;
                        }
                        let amount = Math.min(count * 5, 15);
                        targetUnit.battleContext.additionalDamage += amount;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Kurimuhirudo] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.addSpurs(-5, 0, -5, -0);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KarasuOuNoHashizume] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MorphFimbulvetr] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                enemyUnit.addSpurs(-8, 0, 0, -8);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                let maxBuff = 0;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                    let p = unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : 1;
                    maxBuff = Math.max(p * (unit.atkBuff + unit.resBuff), maxBuff);
                }
                targetUnit.atkSpur += maxBuff;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Kormt] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JollyJadeLance] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NewHeightBow] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BridalSunflowerPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 5, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BlazingPolearms] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BridalOrchidPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(5, 0, 0, 5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DragonBouquet] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TrueLoveRoses] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addSpurs(6, 0, 0, 6)
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WildTigerFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.UpheavalPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() + 1 || enemyUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.YoukoohNoTsumekiba] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MaryuNoBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Mafu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addSpurs(5, 5, 0, 0);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IcyMaltet] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                let amount = targetUnit.dragonflower >= 1 ? 5 : 4;
                targetUnit.addAllSpur(amount);
                if (targetUnit.dragonflower >= 5) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RuinousFrost] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityDecrement--;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HeadsmanGlitnir] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-5, -5, -5, 0);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.reducesCooldownCount = true;
                if (self.canCounterAttack(targetUnit, enemyUnit) || enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EnvelopingBreath] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(0, 6, 0, 6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SilentPower] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Captain.Effulgence] = (targetUnit) => {
            targetUnit.battleContext.invalidateAllOwnDebuffs();
        }
        this._applySkillEffectForUnitFuncDict[Captain.SecretManeuver] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                targetUnit.battleContext.invalidateFollowupAttackSkills();
            }
        }
        this._applySkillEffectForUnitFuncDict[Captain.FlashOfSteel] = (targetUnit) => {
            targetUnit.battleContext.isDesperationActivatable = true;
            targetUnit.battleContext.invalidateCooldownCountSkills();
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FieryBolganone] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || (self.__isSolo(targetUnit) || calcPotentialDamage)) {
                targetUnit.addSpurs(6, 0, 0, 6);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ThundersMjolnir] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ThundererTome] = (targetUnit) => {
            if (self.globalBattleContext.currentTurn <= 3 || targetUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.addSpurs(6, 6, 0, 0);
                targetUnit.battleContext.additionalDamageOfSpecial += 7;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AversasNight] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addSpurs(-4, -4, 0, -4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TakaouNoHashizume] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addSpurs(5, 0, 5, 0);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 0, 5, 0);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LargeWarAxe] = (targetUnit) => {
            if (self.globalBattleContext.isOddTurn) {
                targetUnit.atkSpur += 10;
                targetUnit.spdSpur += 10;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            } else {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SturdyWarSword] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = 0
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 4)) {
                    count++;
                }
                if (count >= 1) {
                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack += Math.trunc(targetUnit.maxSpecialCount / 2);
                }
                if (count >= 2) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.1 * targetUnit.maxSpecialCount, enemyUnit);
                }
                if (count >= 3) {
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WindyWarTome] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AdroitWarTome] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkResTempo3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(-3, 0, 0, -3);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefTempo3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(0, -3, -3, 0);
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResTempo3] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpurs(0, -3, 0, -3);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SharpWarSword] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AscendingBlade] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DotingStaff] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.QuickMulagir] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AzureLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.additionalDamage += 7;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AnyaryuNoBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Hyoushintou] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.atkSpur -= 4;
                    enemyUnit.spdSpur -= 4;
                    enemyUnit.defSpur -= 4;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.atkSpur -= 4;
                        enemyUnit.spdSpur -= 4;
                        enemyUnit.defSpur -= 4;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeireiNoHogu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MagicRabbits] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 6;
                targetUnit.atkSpur += targetUnit.maxSpecialCount * 3;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CarrotTipSpearPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.CarrotTipBowPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PastelPoleaxe] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FaithfulLoyalty] = (targetUnit, enemyUnit) => {
            if (enemyUnit.moveType === MoveType.Armor || enemyUnit.moveType === MoveType.Cavalry) {
                targetUnit.battleContext.isVantageActivatable = true;
            }
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.WilyFighter3] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.invalidateAllBuffs();
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DewDragonstone] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                enemyUnit.addAllSpur(-5);
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.resSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.HvitrvulturePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GronnvulturePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BlarvulturePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SellSpellTome] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let amount = Math.min(7, Math.max(targetUnit.dragonflower + 2, 4));
                targetUnit.addAllSpur(amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfReason] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfVerdane] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GousouJikumunto] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75 || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.HurricaneDagger] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.StaffOfTributePlus] = (targetUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.defSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DestinysBow] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.PiercingTributePlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AchimenesFurl] = (targetUnit, enemyUnit) => {
            let types = new Set();
            for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                types.add(otherUnit.moveType);
            }
            if (types.size >= 2) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
            if (types.size >= 3) {
                targetUnit.battleContext.healedHpByAttack += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SavvyFighter4] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat) {
                enemyUnit.addAtkSpdSpurs(-4);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.SavvyFighter3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.GerberaAxe] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BoneCarverPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DancingFlames] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DrybladeLance] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RoyalHatariFang] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ArgentAura] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SwornLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
                let activatesSkillEffect = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                    if (unit.heroIndex === targetUnit.partnerHeroIndex) activatesSkillEffect = true;
                }
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (unit.heroIndex === targetUnit.partnerHeroIndex) {
                        if (unit.battleContext.restHpPercentage <= 80) {
                            activatesSkillEffect = true;
                        }
                    }
                }
                if (activatesSkillEffect) {
                    targetUnit.atkSpur += 7;
                    targetUnit.defSpur += 7;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AncientCodex] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
                if (targetUnit.isWeaponRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SeireiNoBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getDefInPrecombat() >= enemyUnit.getDefInPrecombat() + 5) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.getDefInPrecombat() >= enemyUnit.getDefInPrecombat() + 1 ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        if (enemyUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.7, enemyUnit);
                        }
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Sogun] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat) {
                    if (enemyUnit.weaponType === WeaponType.Sword ||
                        enemyUnit.weaponType === WeaponType.Lance ||
                        enemyUnit.weaponType === WeaponType.Axe ||
                        isWeaponTypeBreath(enemyUnit.weaponType)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BladeOfJehanna] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.spdSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.invalidatesSpdBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.RapidCrierBow] = (targetUnit) => {
            let found = false;
            let maxBuff = 0;
            for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                found = true;
                let p = unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : 1;
                maxBuff = Math.max(p * (unit.atkBuff + unit.spdBuff), maxBuff);
            }
            targetUnit.atkSpur += maxBuff;
            if (found) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.LunarBrace2] = (targetUnit) => {
            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.JotnarBow] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SparklingFang] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NidavellirSprig] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.NidavellirLots] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SweetYuleLog] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        // 暗闘
        this._applySkillEffectForUnitFuncDict[PassiveC.RedFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Red) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.BlueFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Blue) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.GreenFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Green) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.CFeud3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.color === ColorType.Colorless) {
                enemyUnit.addAllSpur(-4);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LionessBlade] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.AncientRagnell] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.InviolableAxe] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.spdSpur -= 4;
                enemyUnit.defSpur -= 4;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.spdSpur -= 4;
                    enemyUnit.defSpur -= 4;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ManatsuNoBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.OpeningRetainer] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.Worldbreaker] = (targetUnit) => {
            targetUnit.battleContext.increaseCooldownCountForBoth();
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DivineRecreation] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.addAllSpur(-4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.firstAttackReflexDamageRates.push(1.0);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DamiellBow] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FiremansHook] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FangedBasilikos] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.spdSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Byureisuto] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (self.globalBattleContext.isOddTurn || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    enemyUnit.atkSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KazesNeedle] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
                targetUnit.resSpur += 4;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    targetUnit.resSpur += 4;
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.IzunNoKajitsu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.TenraiArumazu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DivineMist] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.ShinkenFalcion] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SpendyScimitar] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                let amount = targetUnit.dragonflower >= 1 ? 6 : 4;
                targetUnit.addAllSpur(amount);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.KeenCoyoteBow] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.Laevatein] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect()) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SoleilsShine] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.SpiderPlushPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsWrath3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2, enemyUnit);
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsWrath4] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.25, enemyUnit);
        }
        this._applySkillEffectForUnitFuncDict[Weapon.EerieScripture] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.LanternBreathPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.WitchBreath] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                enemyUnit.atkSpur -= 6;
                --enemyUnit.battleContext.followupAttackPriorityDecrement;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonstrikeBreath] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.FlamelickBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                enemyUnit.battleContext.hasDeepWounds = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DemonicTome] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        }
        this._applySkillEffectForUnitFuncDict[Weapon.DuskDragonstone] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.NinissIceLance] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlameSiegmund] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 4;
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BowOfTwelve] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat ||
                (targetUnit.battleContext.restHpPercentage >= 75 &&
                    (enemyUnit.isTome || enemyUnit.weaponType === WeaponType.Staff))) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                    // 1戦闘1回まで
                    return !defUnit.battleContext.hasNonSpecialMiracleActivated;
                });
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DriftingGracePlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LuminousGracePlus] = this._applySkillEffectForUnitFuncDict[Weapon.DriftingGracePlus];
        this._applySkillEffectForUnitFuncDict[Weapon.WhirlingGrace] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.JointDistGuard] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit) && enemyUnit.isRangedWeaponType()) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Prescience] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 5;
            enemyUnit.resSpur -= 5;
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MaritaNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (calcPotentialDamage || this.__isSolo(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.invalidateBuffs(false, true, true, false);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) {
                                return;
                            }
                            let spd = atkUnit.getSpdInCombat(defUnit);
                            atkUnit.battleContext.additionalDamage += Math.trunc(spd * 0.1);
                        });
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.VirtuousTyrfing] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    targetUnit.battleContext.restHpPercentage <= 99) {
                    enemyUnit.addAtkDefSpurs(-6);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75 ||
                    targetUnit.battleContext.restHpPercentage <= 99) {
                    enemyUnit.addAtkDefSpurs(-6);
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) {
                            return;
                        }
                        let atk = atkUnit.getAtkInCombat(defUnit);
                        atkUnit.battleContext.additionalDamage += Math.trunc(atk * 0.15);
                    });
                    targetUnit.battleContext.nullCounterDisrupt = true;
                    targetUnit.battleContext.healedHpByAttack += 8;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        enemyUnit.addAtkDefSpurs(-5);
                        targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                            if (isWeaponTypeTome(atkUnit.weaponType) ||
                                atkUnit.weaponType === WeaponType.Staff) {
                                return 0.8;
                            } else {
                                return 0.4;
                            }
                        });
                        if (enemyUnit.battleContext.initiatesCombat &&
                            this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                                if (defUnit.battleContext.hasNonSpecialMiracleActivated) {
                                    return false;
                                }
                                return defUnit.restHpPercentage >= 50;
                            });
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Taiyo] = (targetUnit, enemyUnit) => {
            let amount = targetUnit.isWeaponRefined ? 14 : 10;
            targetUnit.battleContext.healedHpByAttack += amount;
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addAtkDefSpurs(-5);
                    targetUnit.battleContext.addNullInvalidatesHealRatios(0.5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        enemyUnit.addAtkDefSpurs(-5);
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                        if (targetUnit.battleContext.restHpPercentage >= 50) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                    }
                }
            }
        };
        // 迫撃
        {
            let func = spurFunc => {
                return (targetUnit) => {
                    if (targetUnit.battleContext.initiatesCombat) {
                        let healRatio = 0.1 + (targetUnit.maxSpecialCount * 0.2);
                        targetUnit.battleContext.maxHpRatioToHealBySpecial += healRatio;
                        spurFunc(targetUnit);
                    }
                };
            };
            this._applySkillEffectForUnitFuncDict[PassiveA.SurgeSparrow] = func(targetUnit => {
                targetUnit.atkSpur += 7;
                targetUnit.spdSpur += 7;
            });
            this._applySkillEffectForUnitFuncDict[PassiveA.SturdySurge] = func(targetUnit => {
                targetUnit.atkSpur += 7;
                targetUnit.defSpur += 10;
            });
        }
        this._applySkillEffectForUnitFuncDict[Weapon.MoonlessBreath] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
            }
        };
        // ライオン
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.RauarLionPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BlarLionPlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[Weapon.BindingReginleif] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let ratio = targetUnit.isWeaponRefined ? 0.4 : 0.3;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(5);
                    enemyUnit.addSpursWithoutRes(-5);
                    enemyUnit.addSpursWithoutRes(-Math.min(enemyUnit.getPositiveStatusEffects().length, 4));
                    targetUnit.battleContext.invalidateBuffs(true, true, true, false);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PhantasmTome] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.spdSpur -= 6;
                    enemyUnit.resSpur -= 6;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    targetUnit.battleContext.invalidatesResBuff = true;
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.7, enemyUnit);
                    }
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.addSpdResSpurs(-6);
                    targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                    let ratio = targetUnit.battleContext.initiatesCombat ? 0.8 : 0.3;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                        });
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Niu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MakenMistoruthin] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LoyaltySpear] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 4;
                enemyUnit.spdSpur -= 4;
                enemyUnit.defSpur -= 4;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GenesisFalchion] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let buffTotal = self.__getTotalBuffAmountOfTop3Units(targetUnit);
                if (buffTotal >= 10) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                    }
                }
                if (buffTotal >= 25) {
                    targetUnit.atkSpur += 5;
                    let healedHp = targetUnit.isWeaponRefined ? 7 : 5;
                    targetUnit.battleContext.healedHpByAttack += healedHp;
                }
                if (buffTotal >= 60) {
                    targetUnit.battleContext.isVantageActivatable = true;

                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                            let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units, true);
                            targetUnit.addSpurs(...amounts);
                        }
                    );
                }
            }
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ChargingHorn] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let count = 0;
                if (self.__isThereBreakableStructureForEnemyIn2Spaces(targetUnit)) {
                    count = 3;
                }
                else {
                    count = self.__countAllyUnitsInCrossWithOffset(targetUnit, 1);
                }
                if (count >= 1) {
                    let debuffAmount =
                        targetUnit.isWeaponRefined ? Math.min(count * 3, 9) : Math.min(count * 2, 6);
                    enemyUnit.atkSpur -= debuffAmount;
                    enemyUnit.resSpur -= debuffAmount;
                }
                if (count >= 2 && targetUnit.isWeaponRefined) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
                if (count >= 3) {
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.addAtkResSpurs(-6);
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            let status = targetUnit.getDefInCombat(enemyUnit);
                            targetUnit.battleContext.damageReductionValue += Math.trunc(status * 0.2);
                        }
                    );
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.NifuruNoHyoka] = (targetUnit, enemyUnit) => {
            {
                if (!targetUnit.isWeaponRefined) return;
                let allies = Array.from(self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
                if (allies.length >= 1) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                    targetUnit.atkSpur += Math.min(allies.length, 2) * 2;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        let units = Array.from(self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false));
                        let atkMax = units.reduce((max, unit) => Math.max(max, unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : unit.atkBuff), 0);
                        targetUnit.atkSpur += atkMax;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PunishmentStaff] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MermaidBow] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.refersMinOfDefOrRes = true;
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.EbonPirateClaw] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.CrossbonesClaw] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                enemyUnit.spdSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.isDesperationActivatable = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.YngviAscendant] = (targetUnit) => {
            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TigerSpirit] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.EverlivingDomain] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.canActivateNonSpecialMiracle = true;
                let threshold = targetUnit.battleContext.nonSpecialMiracleHpPercentageThreshold;
                targetUnit.battleContext.nonSpecialMiracleHpPercentageThreshold = Math.min(threshold, 75);
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DomainOfFlame] = (targetUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DomainOfIce] = (targetUnit, enemyUnit) => {
            if (self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.spdSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FrostbiteBreath] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAllSpur(-5);
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowDesperation] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdDefSpurs(-4);
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowNTrace3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowForce3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;

                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowGuard3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;

                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.FlowRefresh3] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DolphinDiveAxe] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RaydreamHorn] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.atkSpur += 6;
                enemyUnit.atkSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BrightmareHorn] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Blizard] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.spdSpur -= 4;
                    enemyUnit.resSpur -= 4;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.addAllSpur(-4);
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StoutTomahawk] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Leiptr] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    if (enemyUnit.battleContext.initiatesCombat) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MaskingAxe] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FuginNoMaran] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.JaryuNoBreath] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DragonSkin2] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.LawsOfSacae2] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(6);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DivineSeaSpear] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                targetUnit.defSpur += 3;

                enemyUnit.atkSpur -= 3;
                enemyUnit.spdSpur -= 3;
                enemyUnit.defSpur -= 3;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PeachyParfaitPlus] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.resSpur += 5;
                enemyUnit.resSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SunshadeStaff] = (targetUnit) => {
            if (!self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Scadi] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KenhimeNoKatana] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2) || targetUnit.battleContext.initiatesCombat) {
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MuninNoMaran] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RohyouNoKnife] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Pesyukado] = (targetUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ObservantStaffPlus] = (targetUnit) => {
            {
                if (self.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                    targetUnit.addAllSpur(6);
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.Gradivus] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Siegfried] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.atkSpur -= 4;
                    enemyUnit.defSpur -= 4;
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Raijinto] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.addAllSpur(4)
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.MurderousLion] = (targetUnit, enemyUnit) => {
            if (!self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.spdSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesCounterattack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.ArmoredWall] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.reducesCooldownCount = true;
                if (targetUnit.isTransformed
                    && !targetUnit.isOneTimeActionActivatedForPassiveB
                ) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.FatalSmoke3] = (targetUnit, enemyUnit) => {
            enemyUnit.battleContext.hasDeepWounds = true;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KyoufuArmars] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerLance] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GrimasTruth] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.addAllSpur(-4);
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Shamsir] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkSpdNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.spdSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkResNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResNearTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkSpdFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.spdSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkDefFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.AtkResFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdDefFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpdResFarTrace3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfGrado] = (targetUnit, enemyUnit) => {
            if (!targetUnit.battleContext.initiatesCombat
                || enemyUnit.battleContext.restHpPercentage === 100
            ) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
                targetUnit.battleContext.isAdvantageForColorless = isRangedWeaponType(enemyUnit.weaponType);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StaffOfRausten] = (targetUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LanceOfFrelia] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.defSpur += 10;
                    targetUnit.resSpur += 10;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.MoonTwinWing] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.spdSpur -= 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SunTwinWing] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.LilacJadeBreath] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.addAllSpur(5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GullinkambiEgg] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.atkSpur += 6;
                targetUnit.spdSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TallHammer] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                // 周囲1マスにいない時の強化は別の処理で行っているため、ここでは除外
                if (!self.__isSolo(targetUnit) && targetUnit.battleContext.initiatesCombat) {
                    targetUnit.spdSpur += 6;
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
            else {
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.spdSpur += 6;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Nagurufaru] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.atkSpur -= 4;
                    enemyUnit.resSpur -= 4;
                }
                if (!targetUnit.battleContext.initiatesCombat
                    && targetUnit.battleContext.restHpPercentage >= 70
                ) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.FallenStar] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Audhulma] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Meisterschwert] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                enemyUnit.atkSpur -= 5;
                if (targetUnit.battleContext.initiatesCombat) {
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpySongBow] = (targetUnit) => {
            if (!targetUnit.isWeaponSpecialRefined) return;
            if (self.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                targetUnit.addAllSpur(6);
                targetUnit.battleContext.healedHpByAttack += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.WithEveryone2] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveC.AsNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.ArNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.AdNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.AsFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.AdFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.defSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.ArFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.atkSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DrFarSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveC.DrNearSave3] = (targetUnit) => {
            if (targetUnit.battleContext.isSaviorActivated) {
                targetUnit.defSpur += 4;
                targetUnit.resSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Forusethi] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat
                    && targetUnit.battleContext.restHpPercentage >= 25
                ) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }

                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpringtimeStaff] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat
                    || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                ) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ArdensBlade] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.defSpur += 6;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TomeOfFavors] = (targetUnit, enemyUnit) => {
            if (!isWeaponTypeBeast(enemyUnit.weaponType)) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PurifyingBreath] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ObsidianLance] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (self.__isSolo(targetUnit) || calcPotentialDamage) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Thunderbrand] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.EffiesLance] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 6;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PaleBreathPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SlickFighter3] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.invalidateAllOwnDebuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BlackfireBreathPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.resSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesResBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.Dragonscale] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.resSpur -= 6;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GiltGoblet] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.atkSpur += 6;
                targetUnit.resSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.CourtlyMaskPlus] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.atkSpur += 5;
                targetUnit.resSpur += 5;
            }
        };
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.StoutLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.StoutAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CourtlyBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CourtlyCandlePlus] = func;
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.CraftFighter3] = (targetUnit) => {
            if (!targetUnit.battleContext.initiatesCombat
                && targetUnit.battleContext.restHpPercentage >= 25
            ) {
                targetUnit.battleContext.reducesCooldownCount = true;
                ++targetUnit.battleContext.followupAttackPriorityIncrement;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Garumu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.healedHpByAttack += 7;
                }
                if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ArmorsmasherPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.moveType === MoveType.Armor) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KeenGronnwolfPlus] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.moveType === MoveType.Cavalry) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowerHauteclere] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 6;
                enemyUnit.defSpur -= 6;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                    let amount = 3 + Math.min(dist, 3) * 2;
                    targetUnit.addSpurs(amount, 0, amount, amount);
                    targetUnit.battleContext.healedHpByAttack += 7;
                    enemyUnit.addSpurs(-6, 0, -6, 0);
                    if (dist >= 1) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MoonGradivus] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.increaseCooldownCountForDefense = true;
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addSpurs(0, 5, 5, 5);
                    enemyUnit.addSpurs(0, 0, -5, 0);
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.WindParthia] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.initiatesCombat ||
                (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.5;
                if (targetUnit.isWeaponRefined) {
                    targetUnit.battleContext.addNullInvalidatesHealRatios(0.6);
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DarkSpikesT] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpurs(6, 6, 0, 0);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DeckSwabberPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FlowingLancePlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.atkSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HelmBowPlus] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (calcPotentialDamage || !self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                enemyUnit.spdSpur -= 5;
                enemyUnit.defSpur -= 5;
                targetUnit.battleContext.invalidatesSpdBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShirokiChiNoNaginata] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsIre4] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpurs(-4, 0, 0, -4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }
        this._applySkillEffectForUnitFuncDict[PassiveB.DragonsIre3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShinenNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage
                    && targetUnit.battleContext.restHpPercentage >= 25
                    && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                ) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.StalwartSword] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SnipersBow] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.JukishiNoJuso] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.defSpur += 4;
                    targetUnit.resSpur += 4;
                }

                targetUnit.battleContext.increaseCooldownCountForDefense = true;
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.KarenNoYumi] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KurokiChiNoTaiken] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Aymr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.addAtkDefSpurs(-6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                if (enemyUnit.battleContext.initiatesCombat ||
                    this.__isSolo(targetUnit) || calcPotentialDamage) {
                    enemyUnit.addAtkDefSpurs(-6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.restHpPercentage >= 75 ||
                        this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.addAtkDefSpurs(-5);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TenmaNoNinjinPlus] = (targetUnit, enemyUnit) => {
            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) === TriangleAdvantage.Advantageous) {
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SpendthriftBowPlus] = (targetUnit, enemyUnit) => {
            targetUnit.atkSpur += 7;
            enemyUnit.atkSpur -= 7;
            self.__writeDamageCalcDebugLog(`お大尽の弓により${targetUnit.getNameWithGroup()}の攻撃+7、${enemyUnit.getNameWithGroup()}の攻撃-7`);
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdDefBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SpdResBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DefResBond4] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                targetUnit.battleContext.invalidatesOwnResDebuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.VezuruNoYoran] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.resSpur += 5;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__isThereAllyIn2Spaces(targetUnit, 2) && !calcPotentialDamage) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.battleContext.invalidatesCounterattack = true;
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SuyakuNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.maxHpWithSkills > enemyUnit.battleContext.restHp) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GrayNoHyouken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.addAllSpur(3);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(5);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Randgrior] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.addAtkDefSpurs(-6);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.addAtkDefSpurs(-6);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        let count =
                            targetUnit.getPositiveStatusEffects().length +
                            targetUnit.getNegativeStatusEffects().length;
                        targetUnit.addAllSpur(count * 2);
                        if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Rigarublade] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage === 100) {
                if (targetUnit.isWeaponRefined) {
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                }
                else {
                    targetUnit.atkSpur += 2;
                    targetUnit.spdSpur += 2;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SeikenThirufingu] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeTome(enemyUnit.weaponType)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
            }
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HikariNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.spdSpur += 4;
                    targetUnit.defSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.OukeNoKen] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.initiatesCombat
                    || (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                ) {
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
            else if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Fensariru] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Roputous] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (!enemyUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                    enemyUnit.atkSpur -= 6;
                }
            } else {
                if (!enemyUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.resSpur -= 6;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Buryunhirude] = (targetUnit, enemyUnit) => {
            if (isWeaponTypeTome(enemyUnit.weaponType)) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Seini] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }

                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
            else {
                if (enemyUnit.moveType === MoveType.Armor || enemyUnit.moveType === MoveType.Cavalry) {
                    if (enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Gureipuniru] = (targetUnit, enemyUnit) => {
            if (enemyUnit.battleContext.restHpPercentage === 100) {
                targetUnit.atkSpur += 3;
                targetUnit.spdSpur += 3;
                if (targetUnit.isWeaponSpecialRefined) {
                    enemyUnit.addAllSpur(-4);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ivarudhi] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    targetUnit.resSpur += 3;
                }

                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                }
            }
            else {
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Arrow] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() - 5) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() - 1) {
                    targetUnit.addAllSpur(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Naga] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                    targetUnit.battleContext.canCounterattackToAllDistance = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KiriNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                    x.weaponType === WeaponType.Sword || isWeaponTypeBreath(x.weaponType))
                ) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShikkyuMyurugure] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isAllyCountIsGreaterThanEnemyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            } else {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MizuNoHimatsu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isAllyCountIsGreaterThanEnemyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MugenNoSyo] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isNextToOtherUnits(targetUnit)) {
                    enemyUnit.addAllSpur(-4);
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyIn2Spaces(targetUnit)) {
                    enemyUnit.addAllSpur(-4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Syurugu] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        let amount = targetUnit.getPositiveStatusEffects().length +
                            targetUnit.getNegativeStatusEffects().length;
                        targetUnit.addAllSpur(amount);
                        if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Rifia] = (targetUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            } else {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        let amount = Math.trunc(targetUnit.battleContext.restHp * 0.2);
                        targetUnit.atkSpur += amount;
                        targetUnit.atkSpur += amount;
                    }
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.OgonNoTanken] = (targetUnit) => {
            if (targetUnit.isSpecialCharged) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.OkamijoouNoKiba] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let amount = Math.min(6, count * 2);
                targetUnit.atkSpur += amount;
                targetUnit.spdSpur += amount;
            } else {
                let isOver75 = enemyUnit.battleContext.restHpPercentage >= 75;
                let isThereThree = self.__isThereAllyInSpecifiedSpaces(targetUnit, 3);
                if (isOver75 || isThereThree) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
                if (isOver75 && isThereThree) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.healedHpByAttack += 7;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GuradoNoSenfu] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FeruniruNoYouran] = (targetUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Saferimuniru] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.5)));
                    enemyUnit.addSpurs(-amount, 0, -amount, 0);
                }
            } else {
                // <錬成効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.8)));
                    enemyUnit.addSpurs(-amount, -amount, -amount, 0);
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Erudofurimuniru] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.5)));
                    enemyUnit.addSpurs(-amount, -amount, 0, 0);
                }
            } else {
                // <錬成効果>
                let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                if (diff >= 1) {
                    let amount = Math.max(0, Math.min(8, Math.floor(diff * 0.8)));
                    enemyUnit.addSpurs(-amount, -amount, -amount, 0);
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BoranNoBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let amount = 0;
                switch (count) {
                    case 0:
                        amount = 6;
                        break;
                    case 1:
                        amount = 4;
                        break;
                    case 2:
                        amount = 2;
                        break;
                }
                targetUnit.addAllSpur(amount);
            } else {
                // <錬成効果>
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let amount = 0;
                switch (count) {
                    case 0:
                        amount = 7;
                        break;
                    case 1:
                        amount = 5;
                        break;
                    case 2:
                        amount = 3;
                        break;
                }
                targetUnit.addAllSpur(amount);
                if (count <= 1) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let percentage = Math.max(30 - count * 10, 0);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AsuNoSEikishiNoKen] = (targetUnit, enemyUnit) => {
            if (!enemyUnit.isBuffed) {
                enemyUnit.atkSpur += 6;
                enemyUnit.defSpur += 6;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Flykoogeru] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            let hasHigherDefAlly = self.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                x => x.getDefInPrecombat() > targetUnit.getDefInPrecombat());
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (calcPotentialDamage || !hasHigherDefAlly) {
                    targetUnit.addSpurs(6, 6, 0, 0);
                }
            } else {
                // <錬成効果>
                if (calcPotentialDamage || !hasHigherDefAlly || self.__isSolo(targetUnit)) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    targetUnit.addSpurs(6, 6, 0, 0);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyuryouNoEijin] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let atk = false;
                let spd = false;
                let def = false;
                let res = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                    if (unit.getAtkInPrecombat() > targetUnit.getAtkInPrecombat()) {
                        atk = true;
                    }
                    if (unit.getSpdInPrecombat() > targetUnit.getSpdInPrecombat()) {
                        spd = true;
                    }
                    if (unit.getDefInPrecombat() > targetUnit.getDefInPrecombat()) {
                        def = true;
                    }
                    if (unit.getResInPrecombat() > targetUnit.getResInPrecombat()) {
                        res = true;
                    }
                }
                if (atk) {
                    targetUnit.atkSpur += 5;
                }
                if (spd) {
                    targetUnit.spdSpur += 5;
                }
                if (def) {
                    targetUnit.defSpur += 5;
                }
                if (res) {
                    targetUnit.resSpur += 5;
                }
            } else {
                // <錬成効果>
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                }
                let atk = false;
                let spd = false;
                let def = false;
                let res = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3, false)) {
                    if (unit.getAtkInPrecombat() > targetUnit.getAtkInPrecombat() - 4) {
                        atk = true;
                    }
                    if (unit.getSpdInPrecombat() > targetUnit.getSpdInPrecombat() - 4) {
                        spd = true;
                    }
                    if (unit.getDefInPrecombat() > targetUnit.getDefInPrecombat() - 4) {
                        def = true;
                    }
                    if (unit.getResInPrecombat() > targetUnit.getResInPrecombat() - 4) {
                        res = true;
                    }
                }
                if (atk) {
                    targetUnit.atkSpur += 6;
                }
                if (spd) {
                    targetUnit.spdSpur += 6;
                }
                if (def) {
                    targetUnit.defSpur += 6;
                }
                if (res) {
                    targetUnit.resSpur += 6;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        if (enemyUnit.battleContext.restHpPercentage >= 100 && targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.weaponSkillCondSatisfied = true;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.6, enemyUnit);
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BerukaNoSatsufu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.atkSpur -= 4;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SarieruNoOkama] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.isBuffed || enemyUnit.isMobilityIncreased) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.hasPositiveStatusEffect(targetUnit) || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.MagetsuNoSaiki] = (targetUnit, enemyUnit) => {
            if (self.isOddTurn || enemyUnit.battleContext.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    let amount = Math.trunc(targetUnit.getAtkInPrecombat() * 0.1);
                    enemyUnit.addSpurs(-amount, 0, -amount, 0);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TsubakiNoKinnagitou] = (targetUnit, enemyUnit) => {
            if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() - 3) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyugosyaNoKyofu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ByakuyaNoRyuuseki] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.spdSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesSpdBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.YumikishiNoMiekyu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 4;
                enemyUnit.defSpur -= 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KishisyogunNoHousou] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage < 100) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.PieriNoSyousou] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage < 100) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Tangurisuni] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.isBuffedInCombat(enemyUnit) || targetUnit.isMobilityIncreased) {
                    targetUnit.addAllSpur(3);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KokukarasuNoSyo] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                    self.__writeDamageCalcDebugLog("黒鴉の書の効果が発動、敵の攻魔-6、奥義カウント変動量を-1");
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.resSpur -= 6;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ThiamoNoAisou] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 70) {
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BaraNoYari] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                    enemyUnit.addAtkDefSpurs(-6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addAtkDefSpurs(-5);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AiNoSaiki] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.isBuffed || targetUnit.battleContext.restHpPercentage >= 70) {
                    targetUnit.atkSpur += Math.floor(enemyUnit.getDefInPrecombat() * 0.25);
                    enemyUnit.atkSpur -= Math.floor(enemyUnit.getResInPrecombat() * 0.25);
                }
            } else {
                // <錬成効果>
                if (targetUnit.hasPositiveStatusEffect(enemyUnit) ||
                    targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.addAtkSpdSpurs(Math.floor(enemyUnit.getDefInPrecombat() * 0.25));
                    targetUnit.addAtkDefSpurs(-Math.floor(enemyUnit.getResInPrecombat() * 0.25));
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.battleContext.weaponSkillCondSatisfied = true;
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RazuwarudoNoMaiken] = (targetUnit) => {
            {
                let count = self.__countAlliesWithinSpecifiedSpaces(targetUnit, 3, x =>
                    x.buffTotal >= 10);
                if (count >= 2) {
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ChichiNoSenjutsusyo] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Tenmakoku3] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 7) {
                let resDiff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                let amount = Math.max(0, Math.min(7, Math.floor(resDiff * 0.5)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.PegasusFlight4] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                let resDiff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                let amount = Math.max(0, Math.min(8, Math.floor(resDiff * 0.8)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
                let targetAmount = targetUnit.getEvalSpdInPrecombat() + targetUnit.getEvalResInPrecombat();
                let enemyAmount = enemyUnit.getEvalSpdInPrecombat() + enemyUnit.getEvalResInPrecombat();
                if (targetAmount >= enemyAmount + 1) {
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.WyvernFlight3] = (targetUnit, enemyUnit) => {
            if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                let defDiff = targetUnit.getEvalDefInPrecombat() - enemyUnit.getEvalDefInPrecombat();
                let amount = Math.max(0, Math.min(7, Math.floor(defDiff * 0.5)));
                enemyUnit.atkSpur -= amount;
                enemyUnit.defSpur -= amount;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.AsameiNoTanken] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    if (!targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.isVantageActivatable = true;

                    }
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || !enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.addSpurs(5, 5, 0, 0);
                }
                if (enemyUnit.battleContext.initiatesCombat && !enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.battleContext.isVantageActivatable = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.addSpurs(5, 5, 0, 0);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Jikurinde] = (targetUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                let atk = 0;
                let spd = 0;
                let def = 0;
                let res = 0;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                    if (!unit.hasStatusEffect(StatusEffectType.Panic)) {
                        atk = Math.max(atk, unit.atkBuff);
                        spd = Math.max(spd, unit.spdBuff);
                        def = Math.max(def, unit.defBuff);
                        res = Math.max(res, unit.resBuff);
                    }
                }
                targetUnit.atkSpur += atk;
                targetUnit.spdSpur += spd;
                targetUnit.defSpur += def;
                targetUnit.resSpur += res;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RaikenJikurinde] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.defSpur += 3;
                    targetUnit.resSpur += 3;
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RyukenFalcion] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(5);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Vorufuberugu] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                if (self.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                    targetUnit.addAllSpur(4);
                }
            } else {
                if (targetUnit.battleContext.initiatesCombat || self.__isSolo(targetUnit) || calcPotentialDamage) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DevilAxe] = (targetUnit) => {
            targetUnit.addAllSpur(4);
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ZeroNoGyakukyu] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SyunsenAiraNoKen] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2, enemyUnit);
                    }
                }
            }
            else {
                DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KageroNoGenwakushin] = (targetUnit, enemyUnit) => {
            if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                targetUnit.atkSpur += 4;
                targetUnit.spdSpur += 4;
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Death] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                targetUnit.addAllSpur(4);
            } else {
                // <錬成効果>
                targetUnit.addAllSpur(5);
                let amount = Math.min(targetUnit.maxSpecialCount, 1) + 1;
                enemyUnit.addSpurs(0, -amount, 0, -amount);
                targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RebbekkaNoRyoukyu] = (targetUnit) => {
            if (targetUnit.isBuffed) {
                targetUnit.addAllSpur(4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.SeisyoNaga] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.invalidateAllBuffs();
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.getEvalResInPrecombat() >= enemyUnit.getEvalResInPrecombat() + 3) {
                    targetUnit.addAllSpur(3);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Forukuvangu] = (targetUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage <= 80) {
                    targetUnit.atkSpur += 7;
                    targetUnit.defSpur += 7;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KizokutekinaYumi] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.hp > enemyUnit.hp) {
                    targetUnit.addAllSpur(4);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.RunaNoEiken] = (targetUnit, enemyUnit) => {
            if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                targetUnit.addAllSpur(3);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Sekuvaveku] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 4)) {
                    targetUnit.addAllSpur(6);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 4)) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.HikariToYamito] = (targetUnit, enemyUnit) => {
            enemyUnit.addAllSpur(-2);
            targetUnit.battleContext.invalidateAllBuffs();
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LightAndDark2] = (targetUnit, enemyUnit) => {
            enemyUnit.addAllSpur(-5);
            targetUnit.battleContext.invalidateAllBuffs();
            targetUnit.battleContext.invalidateAllOwnDebuffs();
        };
        this._applySkillEffectForUnitFuncDict[Weapon.ShiseiNaga] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                }
            } else {
                // <錬成効果>
                if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat() || enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                            targetUnit.battleContext.canCounterattackToAllDistance = true;
                        }
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FerisiaNoKorizara] = (targetUnit, enemyUnit) => {
            targetUnit.battleContext.refersMinOfDefOrRes = true;
            if (targetUnit.isWeaponSpecialRefined) {
                if (isWeaponTypeTome(enemyUnit.weaponType)) {
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.MadoNoYaiba3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let isActivated = false;
                for (let unit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
                    if (isWeaponTypeTome(unit.weaponType)) {
                        isActivated = true;
                        break;
                    }
                }
                if (isActivated) {
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoGoka3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.atkSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoShippu3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.spdSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoDaichi3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.defSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.SeimeiNoSeisui3] = (targetUnit, enemyUnit) => {
            if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.resSpur += 6; }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.GaeBolg] = (targetUnit, enemyUnit) => {
            if (enemyUnit.moveType === MoveType.Armor
                || enemyUnit.moveType === MoveType.Cavalry
                || enemyUnit.moveType === MoveType.Infantry
            ) {
                targetUnit.atkSpur += 5;
                targetUnit.defSpur += 5;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                let units = self.enumerateUnitsInTheSameGroupOnMap(targetUnit);
                let found = false;
                for (let unit of units) {
                    if (unit.weaponType === WeaponType.Sword ||
                        unit.weaponType === WeaponType.Lance ||
                        unit.weaponType === WeaponType.Axe ||
                        unit.moveType === MoveType.Cavalry
                    ) {
                        found = true;
                    }
                }
                if (found) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ragnarok] = (targetUnit) => {
            if (isWeaponSpecialRefined(targetUnit.weaponRefinement)) {
                targetUnit.atkSpur += 5;
                targetUnit.spdSpur += 5;
                if (targetUnit.battleContext.restHpPercentage <= 80) {
                    targetUnit.atkSpur += 7;
                    targetUnit.spdSpur += 7;
                }
            }
            else {
                if (targetUnit.battleContext.isRestHpFull) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HokenSophia] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.isRestHpFull) {
                    targetUnit.addAllSpur(4);
                }
            }
            else {
                targetUnit.addAllSpur(4);
                if (targetUnit.isWeaponSpecialRefined) {
                    if (!targetUnit.battleContext.isRestHpFull || !enemyUnit.battleContext.isRestHpFull) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.healedHpByAttack += 7;
                    }
                }
            }

        };
        this._applySkillEffectForUnitFuncDict[Weapon.ImbuedKoma] = (targetUnit, enemyUnit) => {
            if (targetUnit.isSpecialCharged) {
                targetUnit.addAllSpur(5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.addNullInvalidatesHealRatios(0.5);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Marute] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponRefined) {
                if (!targetUnit.battleContext.initiatesCombat
                    && targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (!targetUnit.battleContext.initiatesCombat
                    || enemyUnit.battleContext.restHpPercentage === 100) {
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.defSpur -= 6;
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.HarukazeNoBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if ((!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) ||
                    targetUnit.isBuffed) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                // <錬成効果>
                if ((!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) ||
                    targetUnit.hasPositiveStatusEffect()) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.addSpursWithoutAtk(-4);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addSpursWithoutAtk(-4);
                        targetUnit.battleContext.damageReductionValueOfFirstAttacks += 5;
                        targetUnit.battleContext.healedHpAfterCombat += 7;
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Mulagir] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                if (isWeaponTypeTome(enemyUnit.weaponType)
                ) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            }
            else {
                if (enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
                if (isWeaponSpecialRefined(targetUnit.weaponRefinement)) {
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.Ifingr] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                }
            } else {
                // <錬成効果>
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.addAllSpur(6);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.BookOfShadows] = (targetUnit, enemyUnit) => {
            if (self.__isNextToOtherUnits(targetUnit)) {
                enemyUnit.addAllSpur(-4);
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.FellBreath] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage < 100) {
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.restHpPercentage < 100 || targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() + 1) {
                    targetUnit.atkSpur += 6;
                    targetUnit.resSpur += 6;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.TaguelFang] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!self.__isNextToOtherUnitsExceptDragonAndBeast(targetUnit)) {
                    targetUnit.addAllSpur(3);
                }
            } else {
                // <錬成効果>
                if (!self.__isNextToOtherUnitsExceptDragonAndBeast(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    if (!isWeaponTypeBreathOrBeast(enemyUnit.weaponType)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        };

        this._applySkillEffectForUnitFuncDict[Weapon.SnowsGrace] = (targetUnit, enemyUnit) => {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.DivineBreath] = (targetUnit, enemyUnit, calcPotentialDamage) => {
            if (!calcPotentialDamage) {
                let statusPlus = 0;
                let spaces = targetUnit.isWeaponRefined ? 4 : 2;
                for (let allyUnit of self.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, false)) {
                    if (isWeaponTypeBreath(allyUnit.weaponType)
                        || allyUnit.hasEffective(EffectiveType.Dragon)) {
                        statusPlus += 3;
                    }
                }
                if (statusPlus > 9) {
                    statusPlus = 9;
                }
                targetUnit.atkSpur += statusPlus;
                targetUnit.spdSpur += statusPlus;
                targetUnit.defSpur += statusPlus;
                targetUnit.resSpur += statusPlus;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.25, enemyUnit);
                }
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdPush3] = (targetUnit) => {
            if (targetUnit.battleContext.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.spdSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefPush3] = (targetUnit) => {
            if (targetUnit.battleContext.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.defSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResPush3] = (targetUnit) => {
            if (targetUnit.battleContext.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.resSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkDefPush4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkResPush4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.AtkSpdPush4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DistantStorm] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.DistantPressure] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.spdSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.CloseSalvo] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) { targetUnit.atkSpur += 5; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkSpd3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkSpd4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 9; targetUnit.spdSpur += 10; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkDef3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenAtkRes3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenDefRes3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.defSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenSpdDef3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.defSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[PassiveA.BrazenSpdRes3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.resSpur += 7; }
        };
        this._applySkillEffectForUnitFuncDict[Weapon.KurooujiNoYari] = (targetUnit, enemyUnit) => {
            if (targetUnit.isWeaponSpecialRefined) {
                enemyUnit.atkSpur -= 3;
                enemyUnit.defSpur -= 3;
                targetUnit.battleContext.invalidatesAtkBuff = true;
                targetUnit.battleContext.invalidatesDefBuff = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkDef3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.defSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkSpd3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.spdSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesSpdBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkRes3] = (targetUnit, enemyUnit) => {
            enemyUnit.atkSpur -= 3;
            enemyUnit.resSpur -= 3;
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesResBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdDef3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.defSpur -= 3;
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullAtkDef4] = (targetUnit, enemyUnit) => {
            enemyUnit.addAtkDefSpurs(-4);
            let amount = Math.min(enemyUnit.getPositiveStatusEffects().length, 4);
            enemyUnit.addAtkDefSpurs(-amount);
            targetUnit.battleContext.invalidatesAtkBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdDef4] = (targetUnit, enemyUnit) => {
            enemyUnit.addSpdDefSpurs(-4);
            let amount = Math.min(enemyUnit.getPositiveStatusEffects().length, 4);
            enemyUnit.addSpdDefSpurs(-amount);
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesDefBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.LullSpdRes3] = (targetUnit, enemyUnit) => {
            enemyUnit.spdSpur -= 3;
            enemyUnit.resSpur -= 3;
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesResBuff = true;
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.BeokuNoKago] = (targetUnit, enemyUnit) => {
            if (enemyUnit.moveType === MoveType.Cavalry || enemyUnit.moveType === MoveType.Flying) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[Captain.StormOfBlows] = (targetUnit) => {
            if (targetUnit.isCaptain) {
                targetUnit.battleContext.invalidateAllBuffs();
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.KyokaMukoKinkyori3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.isMeleeWeaponType()) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.KyokaMukoEnkyori3] = (targetUnit, enemyUnit) => {
            if (enemyUnit.isRangedWeaponType()) {
                targetUnit.battleContext.invalidateAllBuffs();
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpecialFighter3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 50) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.SpecialFighter4] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 40) {
                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.addNullInvalidatesHealRatios(0.5);
                targetUnit.battleContext.specialDamageRatioToHeal += 0.3;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel1] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage === 100) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel2] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 90) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Cancel3] = (targetUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 80) {
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        };
        this._applySkillEffectForUnitFuncDict[PassiveB.Guard4] = (targetUnit, enemyUnit) => {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.atkSpur -= 4;
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        };

        {
            let func = (targetUnit) => {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            };
            this._applySkillEffectForUnitFuncDict[PassiveB.MikiriTsuigeki3] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.SphiasSoul] = func;
        }
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.damageRatioToHeal += 0.5;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Absorb] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AbsorbPlus] = func;
        }
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.healedHpByAttack += 5;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SeirinNoKenPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.FuyumatsuriNoStickPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ChisanaSeijuPlus] = func;
        }

        {
            let func = (targetUnit) => {
                if (!targetUnit.battleContext.initiatesCombat) {
                    if (targetUnit.battleContext.restHpPercentage <= 75) {
                        targetUnit.battleContext.isVantageActivatable = true;

                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Reipia] = func;
            this._applySkillEffectForUnitFuncDict[PassiveB.Vantage3] = func;
        }

        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ShellpointLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.TridentPlus] = func;
        }

        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.defSpur += 5;
                    enemyUnit.defSpur -= 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.DefiersAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SunflowerBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.VictorfishPlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.initiatesCombat || self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 6;
                    targetUnit.spdSpur += 6;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.WeddingBellAxe] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.RoseQuartsBow] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Ragnell] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Alondite] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SpringyLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UpFrontBladePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UpFrontLancePlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastSwordPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastSword] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastLance] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SteadfastAxe] = func;
        }
        {
            let func = (targetUnit) => {
                if (self.__isSolo(targetUnit)) {
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBlade] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBladePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundLancePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundAxePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBow] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.UnboundBowPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.resSpur -= 5;
                    targetUnit.battleContext.healedHpByAttack += 4;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.UnityBloomsPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AmityBloomsPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.PactBloomsPlus] = func;
        }
        {
            this._applySkillEffectForUnitFuncDict[Weapon.SeaSearLance] = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.atkSpur -= 6;
                    enemyUnit.defSpur -= 6;
                }
            };
        }
        {
            let func = (targetUnit) => {
                if (self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ReindeerBowPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CandyCanePlus] = func;
        }
        {
            this._applySkillEffectForUnitFuncDict[Weapon.BladeOfShadow] = (targetUnit, enemyUnit) => {
                if (!targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.spdSpur -= 5;
                    enemyUnit.defSpur -= 5;
                }
            };
        }
        {
            let func = (targetUnit) => {
                if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                    targetUnit.atkSpur += 5;
                    targetUnit.resSpur += 5;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.RauarRabbitPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.BlarRabbitPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GronnRabbitPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ConchBouquetPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.MelonFloatPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.HiddenThornsPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit, calcPotentialDamage) => {
                if (!calcPotentialDamage && self.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.OgonNoFolkPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.NinjinhuNoSosyokuPlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    if (self.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                        x.moveType === MoveType.Flying) >= 2
                    ) {
                        targetUnit.addAllSpur(3);
                    }
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.ShirokiNoTyouken] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ShirokiNoTyokusou] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.ShirokiNoTansou] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(2);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.HisenNoNinjinYariPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.HaruNoYoukyuPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (targetUnit.isWeaponSpecialRefined) {
                    DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.WingSword] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Romfire] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.isBuffed) {
                    targetUnit.atkSpur += 4;
                    targetUnit.resSpur += 4;
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.UminiUkabuItaPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.NangokuNoKajitsuPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SunahamaNoScopPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SunahamaNoKuwaPlus] = func;
        }
        {
            let func = (targetUnit) => {
                if (targetUnit.battleContext.isRestHpFull) {
                    targetUnit.addAllSpur(2);
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.SakanaWoTsuitaMori] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SakanaWoTsuitaMoriPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SuikaWariNoKonbo] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.SuikaWariNoKonboPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KorigashiNoYumi] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KorigashiNoYumiPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Kaigara] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KaigaraPlus] = func;
        }
        {
            let func = (targetUnit, enemyUnit) => {
                if (enemyUnit.isRangedWeaponType()) {
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            };
            this._applySkillEffectForUnitFuncDict[Weapon.Kasaburanka] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KasaburankaPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.Grathia] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.GrathiaPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AoNoPresentBukuro] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.AoNoPresentBukuroPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.MidoriNoPresentBukuro] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.MidoriNoPresentBukuroPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.YamaNoInjaNoSyo] = func;
        }
        {
            let func = (targetUnit) => {
                targetUnit.battleContext.reducesCooldownCount = true;
            };
            this._applySkillEffectForUnitFuncDict[Weapon.KabochaNoOno] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KabochaNoOnoPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KoumoriNoYumi] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KoumoriNoYumiPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KajuNoBottle] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.KajuNoBottlePlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoKenPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoYariPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoOnoPlus] = func;
            this._applySkillEffectForUnitFuncDict[Weapon.CancelNoOno] = func;
        }
    },
});
