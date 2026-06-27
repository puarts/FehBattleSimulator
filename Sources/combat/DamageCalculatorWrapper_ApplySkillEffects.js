if (typeof DamageCalculatorWrapper === "undefined") {
    throw new Error("DamageCalculatorWrapper.js must be loaded before this file");
}

DamageCalculatorWrapper.definePrototypeMethods({
    __getPartnersInSpecifiedRange(targetUnit, spaces) {
        return Array.from(this._unitManager.enumeratePartnersInSpecifiedRange(targetUnit, spaces));
    },

    /// 自身を中心とした縦〇列と横〇列にいる味方の人数を返します
    __countAllyUnitsInCrossWithOffset(targetUnit, offset) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, false)) {
            if (unit.isInCrossWithOffset(targetUnit, offset)) {
                ++count;
            }
        }
        return count;
    },

    __isThereBreakableStructureForEnemyIn2Spaces(targetUnit) {
        for (let blockTile of this.map.enumerateBreakableStructureTiles(targetUnit.getEnemyGroupId())) {
            let dist = Math.abs(blockTile.posX - targetUnit.posX) + Math.abs(blockTile.posY - targetUnit.posY);
            if (dist <= 2) {
                return true;
            }
        }
        return false;
    },

    __applySkillEffectForUnit(targetUnit, enemyUnit, damageCalcEnv) {
        let self = this;
        this.profiler.profile("__applySkillEffectForUnit", () => {
            self.____applySkillEffectForUnit(targetUnit, enemyUnit, damageCalcEnv);
        });
    },

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    ____applySkillEffectForUnit(targetUnit, enemyUnit, damageCalcEnv) {
        if (targetUnit.hasStatusEffect(StatusEffectType.Paranoia)) {
            // 【Paranoia】
            // At start of combat, if unit's HP ≤ 99%, grants ATK+5 to unit during combat, and also, if unit initiates combat, unit can make a follow-up attack before foe's next attack.
            // At start of combat, if unit's HP ≤ 99%, if foe initiates combat, and if either that foe's Range = unit's Range or number of【Penalty】effects active on foe excluding stat penalties ≥ 3, unit can counterattack before foe's first attack (excluding when unit's Savior effect triggers).
            if (targetUnit.battleContext.restHpPercentage <= 99) {
                targetUnit.atkSpur += 5;
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.isDesperationActivatable = true;
                }
                if (enemyUnit.battleContext.initiatesCombat) {
                    let areRanged = targetUnit.isRangedWeaponType() && enemyUnit.isRangedWeaponType();
                    let areMelee = targetUnit.isMeleeWeaponType() && enemyUnit.isMeleeWeaponType();
                    let areSameRange = areRanged || areMelee;
                    let negativeCount = enemyUnit.getNegativeStatusEffects().length;
                    if (areSameRange || negativeCount >= 3) {
                        if (!targetUnit.battleContext.isSaviorActivated) {
                            targetUnit.battleContext.isVantageActivatable = true;
                        }
                    }
                }
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.TimesGrip)) {
            targetUnit.addAllSpur(-4);
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.ReducesDamageFromFirstAttackBy40Percent)) {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.Incited)) {
            if (targetUnit.battleContext.initiatesCombat) {
                let amount = Math.min(Unit.calcAttackerMoveDistance(targetUnit, enemyUnit), 3);
                targetUnit.addAllSpur(amount);
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.HushSpectrum)) {
            targetUnit.addAllSpur(-5);
            if (targetUnit.hasNormalAttackSpecial()) {
                targetUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
            }
            if (targetUnit.isReducedMaxSpecialCount() && enemyUnit.hasNormalAttackSpecial()) {
                enemyUnit.battleContext.specialCountReductionBeforeFirstAttackByEnemy += 1;
            }
        }
        // 軽減を半分無効
        if (targetUnit.hasStatusEffect(StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent)) {
            targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
        }
        // 【戦果移譲】
        if (targetUnit.hasStatusEffect(StatusEffectType.ShareSpoils)) {
            // 戦闘中、攻撃、速さ、守備、魔防ー5となる状態異常
            targetUnit.addAllSpur(-5);
            // さらに、自分の奥義以外のスキルによる「ダメージを〇〇％軽減」を無効（範囲奥義を除く）
            enemyUnit.battleContext.invalidatesDamageReductionExceptSpecial = true;
        }
        // 神獣の蜜
        if (targetUnit.hasStatusEffect(StatusEffectType.DivineNectar)) {
            // 【神獣の蜜】
            // 戦闘中、【回復不可】を無効
            targetUnit.battleContext.addNullInvalidatesHealRatios(1);
            // 各ターンについて、自分から攻撃した最初の戦闘と敵から攻撃された最初の戦闘の時、戦闘中、
            // 受けるダメージー10（範囲奥義を除く）
            if (targetUnit.battleContext.initiatesCombat) {
                if (!targetUnit.isAttackDone) {
                    targetUnit.battleContext.damageReductionValue += 10;
                }
            } else {
                if (!targetUnit.isAttackedDone) {
                    targetUnit.battleContext.damageReductionValue += 10;
                }
            }
        }

        if (!targetUnit.isOneTimeActionActivatedForFallenStar
            && targetUnit.hasStatusEffect(StatusEffectType.FallenStar)
        ) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
        }
        if (enemyUnit.battleContext.initiatesCombat &&
            !targetUnit.isOneTimeActionActivatedForDeepStar &&
            targetUnit.hasStatusEffect(StatusEffectType.DeepStar)) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.8, enemyUnit);
        }

        if (targetUnit.hasStatusEffect(StatusEffectType.ResonantShield)) {
            targetUnit.defSpur += 4;
            targetUnit.resSpur += 4;
        }


        if (targetUnit.hasStatusEffect(StatusEffectType.ResonantBlades)) {
            targetUnit.atkSpur += 4;
            targetUnit.spdSpur += 4;
        }

        if (targetUnit.hasStatusEffect(StatusEffectType.Guard)) {
            enemyUnit.battleContext.reducesCooldownCount = true;
        }

        if (targetUnit.hasStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack)) {
            targetUnit.battleContext.increaseCooldownCountForBoth();
        }

        if (targetUnit.hasStatusEffect(StatusEffectType.NeutralizesPenalties)) {
            targetUnit.battleContext.invalidateAllOwnDebuffs();
        }

        if (damageCalcEnv.gameMode === GameMode.SummonerDuels ||
            this.isSummonerDualCalcEnabled) {
            if (targetUnit.attackRange === 1 && enemyUnit.attackRange === 2
                && !targetUnit.battleContext.isSaviorActivated
            ) {
                // 英雄決闘では射程1ボーナスで射程2と闘う時、守備、魔防+7される(護り手発動時は除外)
                targetUnit.addSpurs(0, 0, 7, 7);
            }
        }

        // 今のところ奥義にしかこの効果が存在しないので、重複しない。もし今後重複する場合は重複時の計算方法を調査して実装する
        targetUnit.battleContext.selfDamageDealtRateToAddSpecialDamage =
            getSelfDamageDealtRateToAddSpecialDamage(targetUnit.special);

        // 天脈効果
        let targetTile = targetUnit.placedTile;
        switch (targetTile.divineVein) {
            case DivineVeinType.Water:
                if (targetTile.divineVeinGroup === enemyUnit.groupId) {
                    // * 敵は戦闘中、速さー5、
                    targetUnit.spdSpur -= 5;
                    // * 奥義以外のスキルによる「ダメージを〇〇％軽減」を半分無効（無効にする数値は数切捨て）（範囲奥義を除く）（付与マスに既に天脈がある場合、それを上書きする）（同じタイミングに異なる複数の天脈の付与が発生した場合、天脈は消滅する）
                    enemyUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                }
                break;
            case DivineVeinType.Stone:
                if (targetTile.divineVeinGroup === targetUnit.groupId) {
                    targetUnit.addDefResSpurs(6);
                    targetUnit.battleContext.damageReductionValueOfSpecialAttack += 10;
                }
                break;
            case DivineVeinType.Green:
                if (targetTile.divineVeinGroup === enemyUnit.groupId) {
                    enemyUnit.battleContext.reducesCooldownCount = true;
                }
                break;
            case DivineVeinType.Haze:
                if (targetTile.divineVeinGroup === enemyUnit.groupId) {
                    targetUnit.addAllSpur(-5);
                    enemyUnit.battleContext.invalidateAllBuffs();
                }
                break;
        }

        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('戦闘開始時').setLogLevel(getSkillLogLevel())
            .setDamageType(damageCalcEnv.damageType).setIsStatusFixed(false).setCombatPhase(this.combatPhase)
            .setGroupLogger(damageCalcEnv.getCombatLogger());
        AT_START_OF_COMBAT_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let skillId of targetUnit.enumerateSkills()) {
            let skillFunc = this._applySkillEffectForUnitFuncDict[skillId];
            if (skillFunc) {
                skillFunc(targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
            }
            getSkillFunc(skillId, applySkillEffectForUnitFuncMap)?.call(this, targetUnit, enemyUnit,
                damageCalcEnv.calcPotentialDamage);
            // 無色への相性有利の評価
            if (ADVANTAGEOUS_AGAINST_COLORLESS_WEAPONS.has(skillId)) {
                targetUnit.battleContext.isAdvantageForColorless = true;
            }
        }
    },

    __applySkillEffectForUnitImpl_Optimized(skillId, targetUnit, enemyUnit, calcPotentialDamage) {
        let skillFunc = this._applySkillEffectForUnitFuncDict[skillId];
        if (skillFunc) {
            skillFunc(targetUnit, enemyUnit, calcPotentialDamage);
        }
    },

    __getTotalBuffAmountOfTop3Units(targetUnit) {
        let units = [];
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, false)) {
            units.push(unit);
        }

        units.sort(function (a, b) {
            return b.buffTotal - a.buffTotal;
        });

        let total = 0;
        for (let i = 0; i < 3; ++i) {
            if (i === units.length) {
                break;
            }

            total += units[i].buffTotal;
        }
        return total;
    },

    __applySkillEffectRelatedToEnemyStatusEffects(targetUnit, enemyUnit, _calcPotentialDamage) {
        for (let func of targetUnit.battleContext.applySkillEffectRelatedToEnemyStatusEffectsFuncs) {
            func(targetUnit, enemyUnit, _calcPotentialDamage);
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            // 機先
            this.catchFuncs[skillId]?.(targetUnit, enemyUnit);

            // TODO: 機先以外のスキルも同様に辞書にいれる
            switch (skillId) {
                case PassiveB.KillingIntent:
                case PassiveB.KillingIntentPlus:
                    if (enemyUnit.battleContext.restHpPercentage < 100 || enemyUnit.hasNegativeStatusEffect()) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case PassiveB.DeadlyBalancePlus:
                    if (targetUnit.battleContext.restHpPercentage >= 25 || targetUnit.hasNegativeStatusEffect()) {
                        enemyUnit.addSpursWithoutRes(-5);
                        targetUnit.battleContext.reducesCooldownCount = true;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                    break;
                case PassiveB.ShisyaNoChojiriwo:
                    if (targetUnit.battleContext.restHpPercentage >= 50 || targetUnit.hasNegativeStatusEffect()) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.HurricaneDagger:
                    if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasPositiveStatusEffect(targetUnit)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.Gyorru:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25 || enemyUnit.
                            hasNegativeStatusEffect()) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                        }
                    }
                    break;
                case Weapon.FukenFalcion:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.restHpPercentage < 100
                            || targetUnit.hasPositiveStatusEffect(enemyUnit)
                        ) {
                            targetUnit.addAllSpur(5);
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.defSpur += 5;
                                --enemyUnit.battleContext.followupAttackPriorityDecrement;
                            }
                        }
                    }
                    else {
                        if (targetUnit.battleContext.restHpPercentage < 100) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.EternalBreath:
                    {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                enemyUnit.atkSpur -= 4;
                                enemyUnit.refSpur -= 4;
                                targetUnit.battleContext.increaseCooldownCountForDefense = true;
                            }
                        }
                    }
                    break;
                case Weapon.SpiritedSwordPlus:
                case Weapon.SpiritedAxePlus:
                case Weapon.SpiritedSpearPlus:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.PledgedBladePlus:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.HugeFanPlus:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.SetsunasYumi:
                    {
                        if (enemyUnit.isRangedWeaponType()) {
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                                targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                            }
                        }
                    }
                    break;
                case Weapon.VoidTome:
                    if (enemyUnit.getAtkInPrecombat() >= 50
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.WeirdingTome:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.HigasaPlus:
                case Weapon.TairyoNoYuPlus:
                case Weapon.KaigaraNoNaifuPlus:
                    if (enemyUnit.hasNegativeStatusEffect()) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.HarorudoNoYufu:
                    if (targetUnit.isBuffed) {
                        targetUnit.addAllSpur(3);
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.hasNegativeStatusEffect()
                            || !targetUnit.battleContext.isRestHpFull
                        ) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.MaryuNoBreath:
                    if (targetUnit.hasNegativeStatusEffect() ||
                        !targetUnit.battleContext.isRestHpFull ||
                        (targetUnit.isWeaponRefined && enemyUnit.battleContext.initiatesCombat)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.Fimbulvetr:
                    if (!targetUnit.isWeaponRefined) {
                        // <通常効果>
                        if (targetUnit.battleContext.restHpPercentage < 100 || targetUnit.hasNegativeStatusEffect()) {
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                            targetUnit.addAllSpur(4);
                        }
                    } else {
                        // <錬成効果>
                        if (targetUnit.battleContext.restHpPercentage < 100 ||
                            targetUnit.hasNegativeStatusEffect() ||
                            enemyUnit.battleContext.restHpPercentage >= 75) {
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                targetUnit.addAllSpur(4);

                                let amount;
                                if (enemyUnit.special !== Special.None) {
                                    amount = Math.max(10 - enemyUnit.maxSpecialCount * 2, 2);
                                } else {
                                    amount = 2;
                                }
                                enemyUnit.addAtkResSpurs(-amount);
                            }
                            let pred = ally =>
                                targetUnit.partnerHeroIndex === ally.heroIndex ||
                                ally.partnerHeroIndex === targetUnit.heroIndex;
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3, pred)) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                        }
                    }
                    break;
                case Weapon.RuneAxe:
                    targetUnit.battleContext.healedHpByAttack += 7;
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.MasyouNoYari:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage < 100
                            || enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                            targetUnit.defSpur += 5;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
            }
        }
    },

    // atk, spd, def, resには適用するステータスなら1をそうでない場合は0を渡す
    __applyCatch3(targetUnit, enemyUnit, atk, spd, def, res) {
        if (enemyUnit.battleContext.restHpPercentage === 100 ||
            enemyUnit.hasNegativeStatusEffect()) {
            targetUnit.addSpurs(5 * atk, 5 * spd, 5 * def, 5 * res);
        }
    },

    // atk, spd, def, resには適用するステータスなら1をそうでない場合は0を渡す
    __applyCatch4(targetUnit, enemyUnit, atk, spd, def, res) {
        if (enemyUnit.battleContext.restHpPercentage === 100 ||
            enemyUnit.hasNegativeStatusEffect()) {
            targetUnit.addSpurs(7 * atk, 7 * spd, 7 * def, 7 * res);

            if (enemyUnit.battleContext.restHpPercentage === 100
                && enemyUnit.hasNegativeStatusEffect()) {
                targetUnit.addSpurs(2 * atk, 2 * spd, 2 * def, 2 * res);
            }
        }
    },

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {DamageCalcEnv} damageCalcEnv
     */
    __applySkillEffectForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, damageCalcEnv) {
        for (let func of targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs) {
            func(targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        }
        let env = new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('戦闘中バフ決定後のスキル').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedNodes.forEach(node => node.evaluate(env));
        NON_STATS_SKILL_USING_STATS_HOOKS.evaluateWithUnit(targetUnit, env);

        if (targetUnit.hasStatusEffect(StatusEffectType.BonusDoubler)) {
            if (!targetUnit.hasStatusEffect(StatusEffectType.Ploy)) {
                DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
            }
        }
        if (targetUnit.hasStatusEffect(StatusEffectType.NullFollowUp)) {
            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
        }

        {
            for (let skillId of targetUnit.enumerateSkills()) {
                let func = getSkillFunc(skillId, applySkillEffectForUnitAfterCombatStatusFixedFuncMap);
                func?.call(this, targetUnit, enemyUnit);
                switch (skillId) {
                    // リーダースキル
                    case Captain.SecretManeuver:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    // ユニットスキル
                    case Weapon.TeatimeSetPlus:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                        break;
                    case Weapon.FairFightBlade:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.DEF, 0.25);
                        }
                        break;
                    case Weapon.RadiantAureola:
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.RES);
                        }
                        break;
                    case Weapon.BaraNoYari:
                        if (targetUnit.isWeaponRefined) {
                            let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalAtkInCombat(targetUnit);
                            if (targetUnit.battleContext.restHpPercentage >= 25 || diff > 1) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                            }
                        }
                        break;
                    case Weapon.TwinDivinestone:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalResInCombat(enemyUnit) > enemyUnit.getResInCombat(targetUnit)) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (isNormalAttackSpecial(enemyUnit.special)) {
                                if (targetUnit.getEvalResInCombat(enemyUnit) >=
                                    enemyUnit.getEvalResInCombat(targetUnit) + 5) {
                                    enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
                                }
                            }
                        }
                        break;
                    case Weapon.RevengerLance:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                let def = targetUnit.getDefInCombat(enemyUnit);
                                targetUnit.battleContext.damageReductionValue += Math.trunc(def * 0.15);
                            }
                        }
                        break;
                    case Weapon.ArcaneDevourer:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    case Weapon.CaptainsSword:
                        if (targetUnit.battleContext.restHpPercentage >= 25 &&
                            enemyUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                targetUnit.battleContext.isVantageActivatable = true;
                            }
                        }
                        break;
                    case Weapon.ArcaneLuin:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >
                                enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                        break;
                    case Weapon.RevealingBreath:
                        if (enemyUnit.battleContext.initiatesCombat ||
                            enemyUnit.battleContext.restHpPercentage >= 75) {
                            let amount = Math.trunc(targetUnit.getResInCombat(enemyUnit) * 0.3);
                            targetUnit.battleContext.damageReductionValueOfFollowupAttack += amount;
                        }
                        break;
                    case Weapon.ImbuedKoma:
                        if (targetUnit.isWeaponRefined) {
                            if (targetUnit.isSpecialCharged) {
                                let def = targetUnit.getDefInCombat(enemyUnit);
                                targetUnit.battleContext.damageReductionValue += Math.trunc(def * 0.2);
                            }
                        }
                        break;
                    case Weapon.KouketsuNoSensou:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                                this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.ATK);
                            }
                        }
                        break;
                    case Weapon.PetalfallVasePlus:
                    case Weapon.PetalfallBladePlus:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                targetUnit.battleContext.additionalDamage += 5;
                            }
                        }
                        break;
                    case Weapon.DuskbloomBow:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 1) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (diff >= 4) {
                                targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getResInCombat(enemyUnit) * 0.2);
                            }
                            if (diff >= 7) {
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                        break;
                    case Weapon.DawnsweetBox: {
                        let diff = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInCombat(targetUnit);
                        if (diff >= -4) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }
                        if (diff >= 0) {
                            targetUnit.battleContext.healedHpAfterCombat += 7;
                        }
                        if (diff >= 4) {
                            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) === TriangleAdvantage.Advantageous) {
                                if (isNormalAttackSpecial(targetUnit.special)) {
                                    enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                                }
                            }
                        }
                    }
                        break;
                    case Weapon.DreamingSpear:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.RES);
                        }
                        break;
                    case Weapon.BouryakuNoSenkyu:
                        if (targetUnit.isWeaponRefined) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                let total = targetUnit.buffTotal + Math.abs(enemyUnit.debuffTotal);
                                let percentage = Math.min(total * 3, 60);
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
                                if (total >= 10) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.DualityVessel:
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            let def = targetUnit.getDefInCombat(enemyUnit);
                            targetUnit.battleContext.damageReductionValue += Math.trunc(def * 0.2);
                        }
                        break;
                    case Weapon.KeenRabbitFang:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                        break;
                    case Weapon.FangOfFinality:
                        if (targetUnit.battleContext.initiatesCombat || this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                            let count = this.__countAlliesWithinSpecifiedSpaces(enemyUnit, 3) + 1;
                            let spd = targetUnit.getSpdInCombat(enemyUnit);
                            let amount = Math.trunc(spd * (Math.min(count * 10.0, 30.0) / 100.0));
                            targetUnit.battleContext.additionalDamage += amount;
                        }
                        break;
                    case Weapon.PastelPoleaxe:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.DEF);
                        }
                        break;
                    case Weapon.Tangurisuni:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                if (enemyUnit.battleContext.initiatesCombat && isRangedWeaponType(enemyUnit.weaponType)) {
                                    if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                        targetUnit.battleContext.isVantageActivatable = true;
                                        targetUnit.battleContext.isDefDesperationActivatable = true;
                                    }
                                }
                            }
                        }
                        break;
                    case Weapon.ReginRave:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                                targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                            }
                        }
                        break;
                    case PassiveB.BeastAgility3:
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                        break;
                    case Weapon.BoranNoBreath:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                let atk = targetUnit.getEvalAtkInCombat(enemyUnit);
                                let res = enemyUnit.getEvalResInCombat(targetUnit);
                                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                                if (atk > res) {
                                    let percentage = Math.max(30 - count * 10, 0);
                                    targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc((atk - res) * percentage / 100.0);
                                }
                            }
                        }
                        break;
                    case Weapon.ChaosManifest:
                        if (!targetUnit.isWeaponRefined) {
                            // <通常効果>
                            if (enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.atkSpur += 6;
                            }
                        } else {
                            // <錬成効果>
                            if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                                targetUnit.addSpurs(6, 0, 0, 5);
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                                let debuffTotal = enemyUnit.debuffTotal;
                                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                                    debuffTotal = Math.min(debuffTotal, unit.getDebuffTotal(true));
                                }
                                let ratio = -1 * debuffTotal * 2.0 / 100.0;
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                            }
                        }
                        break;
                    case Weapon.FloweryScroll:
                        if (targetUnit.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(targetUnit)) {
                            targetUnit.battleContext.isVantageActivatable = true;
                        }
                        break;
                    case Weapon.RazingBreath:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                                if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                    if (targetUnit.battleContext.initiatesCombat) {
                                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                                    }
                                    if (enemyUnit.battleContext.initiatesCombat) {
                                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                                    }
                                }
                            }
                        }
                        break;
                    case Weapon.GhostlyLanterns:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(targetUnit) + 5) {
                                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                            }
                        }
                        break;
                    case Weapon.WarriorsSword:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                        }
                        break;
                    case Weapon.TempestsClaw:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            targetUnit.battleContext.damageReductionValue += Math.trunc(targetUnit.getEvalDefInCombat(enemyUnit) * 0.15);
                        }
                        break;
                    case Weapon.MoonGradivus:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.DEF);
                            }
                        }
                        break;
                    case Weapon.FirelightLance:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) - 4) {
                                targetUnit.battleContext.reducesCooldownCount = true;
                            }
                        }
                        break;
                    case Weapon.AwokenBreath:
                    case Weapon.WandererBlade:
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                targetUnit.battleContext.increaseCooldownCountForBoth();
                            }
                        }
                        break;
                    case Weapon.YonkaiNoSaiki:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                    enemyUnit.getEvalSpdInCombat(targetUnit) + 10) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.Flykoogeru:
                        if (targetUnit.isWeaponRefined && targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let spd = targetUnit.getEvalSpdInCombat(enemyUnit);
                            targetUnit.battleContext.additionalDamage += Math.trunc(spd * 0.1);
                        }
                        break;
                    case Weapon.DivineBreath:
                        if (targetUnit.isWeaponSpecialRefined && targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            let amount = Math.trunc(diff * 0.25);
                            if (amount >= 0) {
                                targetUnit.battleContext.additionalDamageOfFirstAttack += amount;
                            }
                        }
                        break;
                    case Weapon.ShadowyQuill:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let damage = targetUnit.getBuffsEnemyDebuffsInCombat(enemyUnit)
                                .reduce((i, a) => i + Math.max(a[0], Math.abs(a[1])), 0);
                            targetUnit.battleContext.additionalDamage += damage;
                        }
                        break;
                    case Weapon.LoftyLeaflet:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let amount = Math.trunc(targetUnit.getEvalSpdInCombat(enemyUnit) * 0.15);
                            targetUnit.battleContext.additionalDamage += amount;
                            let buffs = enemyUnit.getBuffsInCombat(targetUnit);
                            targetUnit.addSpurs(...buffs);
                            enemyUnit.addSpurs(...buffs.map(a => -a));
                        }
                        break;
                    case Weapon.TriEdgeLance:
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            let res = enemyUnit.getEvalResInCombat(targetUnit);
                            targetUnit.battleContext.additionalDamage += Math.trunc(res * 0.2);
                        }
                        break;
                    case Weapon.MilasTestament:
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            let amount = Math.trunc(enemyUnit.getEvalAtkInCombat(targetUnit) * 0.1);
                            targetUnit.battleContext.additionalDamage += amount;
                        }
                        break;
                    case Weapon.TaguelFang:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                let diff = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInCombat(targetUnit);
                                if (diff >= 1) {
                                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                                }
                                if (diff >= 5) {
                                    targetUnit.battleContext.additionalDamage += 7;
                                }
                            }
                        }
                        break;
                    case Weapon.WhitecapBowPlus:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.battleContext.initiatesCombat) {
                                if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 10) {
                                    targetUnit.battleContext.attackCount = 2;
                                }
                            }
                        }
                        break;
                    case Weapon.FrozenDelight:
                        if (targetUnit.battleContext.initiatesCombat) {
                            let buff = targetUnit.getBuffTotalInCombat(enemyUnit);
                            let debuff = Math.abs(enemyUnit.getDebuffTotalInCombat());
                            if (buff + debuff >= 12) {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.MoonlightDrop:
                        if (targetUnit.battleContext.initiatesCombat) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (5 <= diff && diff <= 14) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            } else if (15 <= diff) {
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
                        break;
                    case Weapon.KarasuOuNoHashizume:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.isTransformed || enemyUnit.battleContext.restHpPercentage >= 75) {
                                let d = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInCombat(targetUnit);
                                if (d >= 1) {
                                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                                }
                                if (d >= 6) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.FellBreath:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                let amount = Math.max(diff, 0);
                                targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(amount * 0.3);
                            }
                        }
                        break;
                    case Weapon.Saferimuniru:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                if (diff >= 1) {
                                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                                }
                                if (diff >= 7) {
                                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                                }
                            }
                        }
                        break;
                    case Weapon.Erudofurimuniru:
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                                if (targetUnit.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(targetUnit) + 1) {
                                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                                }
                            }
                        }
                        break;
                    case Weapon.IcyMaltet:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                            }
                        }
                        break;
                    case Weapon.RuinousFrost:
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            let res = enemyUnit.getEvalResInCombat(targetUnit);
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(res * 0.4);
                        }
                        break;
                    case Weapon.ThundersMjolnir:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            if (targetUnit.battleContext.initiatesCombat &&
                                targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 10) {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.Syurugu:
                        if (targetUnit.isWeaponRefined) {
                            let spd = targetUnit.getEvalSpdInCombat(enemyUnit);
                            if (spd >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1 ||
                                enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.addSpurs(5, 5, 0, 0);
                                targetUnit.battleContext.additionalDamage += Math.trunc(spd * 0.15);
                            }
                        }
                        break;
                    case Weapon.LargeWarAxe:
                        if (this.globalBattleContext.isOddTurn) {
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(targetUnit.getEvalAtkInCombat(enemyUnit) * 0.15);
                        }
                        break;
                    case Weapon.WindyWarTome:
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 5) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                            }
                        }
                        break;
                    case Weapon.AdroitWarTome:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 1) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (diff >= 10) {
                                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                            }
                        }
                        break;
                    case Weapon.QuickMulagir:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 5) {
                                targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(targetUnit.getEvalSpdInCombat(enemyUnit) * 0.15);
                                return true;
                            }
                        }
                        break;
                    case Weapon.CarrotTipBowPlus:
                    case Weapon.CarrotTipSpearPlus:
                        if (enemyUnit.battleContext.restHpPercentage >= 75 || enemyUnit.hasNegativeStatusEffect()) {
                            let amount = Math.abs(enemyUnit.getAtkDebuffInCombat()) + Math.abs(enemyUnit.getDefDebuffInCombat());
                            targetUnit.battleContext.additionalDamageOfFirstAttack += amount;
                        }
                        break;
                    case Weapon.BrightShellEgg:
                        if (targetUnit.hasPositiveStatusEffect(enemyUnit) || enemyUnit.hasNegativeStatusEffect()) {
                            enemyUnit.spdSpur -= 6;
                            enemyUnit.resSpur -= 6;
                            let amount = targetUnit.getBuffTotalInCombat(enemyUnit) + Math.abs(enemyUnit.getDebuffTotalInCombat());
                            if (amount >= 6) {
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                        break;
                    case Weapon.SellSpellTome:
                        if (targetUnit.battleContext.restHpPercentage >= 25 && targetUnit.dragonflower >= 3) {
                            DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                        }
                        break;
                    case Weapon.BowOfVerdane:
                        if (targetUnit.isWeaponSpecialRefined) {
                            let diff = targetUnit.getEvalSpdInCombat(enemyUnit) - enemyUnit.getEvalSpdInPrecombat(targetUnit);
                            if (diff >= 3) {
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                            if (diff >= 7) {
                                targetUnit.battleContext.isDesperationActivatable = true;
                            }
                        }
                        break;
                    case Weapon.GousouJikumunto:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                if (enemyUnit.battleContext.initiatesCombat) {
                                    let diff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalAtkInCombat(targetUnit);
                                    if (diff > 0) {
                                        targetUnit.battleContext.counterattackCount = 2;
                                    }
                                }
                            }
                        }
                        break;
                    case Weapon.Rifia:
                        if (targetUnit.isWeaponRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                                (targetUnit.battleContext.initiatesCombat ||
                                    targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit))) {
                                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                                targetUnit.battleContext.reducesCooldownCount = true;
                            }
                        }
                        break;
                    case Weapon.SparklingFang:
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                    case Weapon.SweetYuleLog:
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let spdDiff = targetUnit.getEvalSpdInCombat() - enemyUnit.getEvalSpdInCombat();
                            if (spdDiff <= 9) {
                                targetUnit.battleContext.isDesperationActivatable = true;
                            } else {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                        break;
                    case Weapon.KazesNeedle:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25) {
                                if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getEvalSpdInCombat() + 1) {
                                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.RyukenFalcion:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.restHpPercentage >= 25 && isPhysicalWeaponType(enemyUnit.weaponType)) {
                                if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getEvalSpdInCombat() + 1) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.ShikkyuMyurugure:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                                targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalSpdInCombat() * 0.15);
                            }
                        }
                        break;
                    case Weapon.Misteruthin:
                        if (!targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.increaseCooldownCountForDefense = true;
                        }
                        if (targetUnit.isWeaponRefined) {
                            if (enemyUnit.battleContext.restHpPercentage >= 50) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                            if (targetUnit.isWeaponSpecialRefined) {
                                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.spdSpur += 5;
                                    targetUnit.battleContext.weaponSkillCondSatisfied = true;
                                }
                            }
                        }
                        break;
                    case Weapon.MermaidBow:
                        if (targetUnit.battleContext.restHpPercentage >= 25 &&
                            targetUnit.battleContext.initiatesCombat) {
                            if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) === TriangleAdvantage.Advantageous) {
                                if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getSpdInCombat() + 1) {
                                    targetUnit.battleContext.attackCount = 2;
                                }
                            }
                        }
                        break;
                    case Weapon.PlegianAxePlus:
                    case Weapon.VultureAxePlus:
                    case Weapon.VultureAxe:
                    case Weapon.VultureBladePlus:
                    case Weapon.VultureBlade:
                    case Weapon.VultureLancePlus:
                    case Weapon.VultureLance:
                        if (this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                        break;
                    case Weapon.PlegianBowPlus:
                        if (this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        }
                        break;
                    case Weapon.PlegianTorchPlus:
                        if (this.__isSolo(targetUnit) || damageCalcEnv.calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.resSpur -= 5;
                            enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                            enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                        }
                        break;
                    case Weapon.ShinkenFalcion:
                        DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                        break;
                    case Weapon.FoxkitFang:
                        if (targetUnit.isWeaponSpecialRefined) {
                            // <特殊錬成効果>
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                                let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                if (diff >= 1) {
                                    targetUnit.battleContext.reducesCooldownCount = true;
                                }
                                if (diff >= 5) {
                                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                                }
                            }
                        }
                        break;
                    case Weapon.KentoushiNoGoken:
                        DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        break;
                    case PassiveB.SealAtk4:
                        if (enemyUnit.atkDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SealSpd4:
                        if (enemyUnit.spdDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SealDef4:
                        if (enemyUnit.defDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SealRes4:
                        if (enemyUnit.resDebuffTotal < 0) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                        break;
                    case PassiveB.SpdPreempt3:
                        if (enemyUnit.battleContext.initiatesCombat && enemyUnit.isRangedWeaponType()) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 1) {
                                if (!targetUnit.battleContext.isSaviorActivated) {
                                    targetUnit.battleContext.isVantageActivatable = true;
                                }
                            }
                        }
                        break;
                    case PassiveB.AssuredRebirth:
                        if (targetUnit.getEvalResInCombat(enemyUnit) > enemyUnit.getEvalResInCombat(targetUnit)) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                        break;
                    case PassiveB.FlowFeather3:
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) - 10) {
                                let diff = targetUnit.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(targetUnit);
                                let amount = Math.trunc(Math.min(7, Math.max(0, diff * 0.70)));
                                targetUnit.battleContext.additionalDamage += amount;
                                targetUnit.battleContext.damageReductionValue += amount;
                            }
                        }
                        break;
                    case PassiveB.FlowFlight3:
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) - 10) {
                                let diff = targetUnit.getEvalDefInCombat(enemyUnit) - enemyUnit.getEvalDefInCombat(targetUnit);
                                let amount = Math.trunc(Math.min(7, Math.max(0, diff * 0.70)));
                                targetUnit.battleContext.additionalDamage += amount;
                                targetUnit.battleContext.damageReductionValue += amount;
                            }
                        }
                        break;
                    case PassiveB.SavvyFighter4:
                        if (enemyUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                enemyUnit.getEvalSpdInCombat(targetUnit) - 10) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                            }
                        }
                        break;
                    case PassiveB.SavvyFighter3:
                        if (enemyUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                enemyUnit.getEvalSpdInCombat(targetUnit) - 4) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                        break;
                    case PassiveB.BoldFighter3:
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveB.VengefulFighter3:
                        if (!targetUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 50) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveC.WoefulUpheaval: {
                        let atkDiff = targetUnit.getEvalAtkInCombat(enemyUnit) - enemyUnit.getEvalAtkInCombat(targetUnit);
                        let hpDiff = enemyUnit.maxHpWithSkills - enemyUnit.battleContext.restHp;
                        let total = Math.max(atkDiff, 0) + hpDiff;
                        let ratio = Math.min(total * 3.0 / 100.0, 0.3);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(ratio, enemyUnit);
                    }
                        break;
                    case PassiveB.DragonsWrath3:
                        if (enemyUnit.battleContext.initiatesCombat) {
                            let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.2);
                        }
                        break;
                    case PassiveB.DragonsWrath4: {
                        let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                        targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.25);
                    }
                        break;
                    case PassiveC.DomainOfFlame:
                        if (this.__isThereAllyIn2Spaces(targetUnit)) {
                            let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.3);
                        }
                        break;
                    case PassiveA.Kyokazohuku3:
                        DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                        break;

                    case PassiveA.HeavyBlade1:
                        if (targetUnit.getAtkInCombat(enemyUnit) >= enemyUnit.getAtkInCombat(targetUnit) + 5) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveA.HeavyBlade2:
                        if (targetUnit.getAtkInCombat(enemyUnit) >= enemyUnit.getAtkInCombat(targetUnit) + 3) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveA.HeavyBlade3:
                    case PassiveA.HeavyBlade4:
                        DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        break;
                    case PassiveA.FlashingBlade1:
                        if (targetUnit.getSpdInCombat(enemyUnit) >= enemyUnit.getSpdInCombat(targetUnit) + 5) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveA.FlashingBlade2:
                        if (targetUnit.getSpdInCombat(enemyUnit) >= enemyUnit.getSpdInCombat(targetUnit) + 3) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        break;
                    case PassiveA.FlashingBlade3:
                    case PassiveA.FlashingBlade4:
                        DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                        break;
                    case PassiveA.FlashSparrow:
                        if (targetUnit.battleContext.initiatesCombat) {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >=
                                enemyUnit.getEvalSpdInCombat(targetUnit) - 5) {
                                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                            }
                        }
                }
            }
        }

        for (let unit of this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.DomainOfFlame: {
                        let d = Math.max(targetUnit.getEvalAtkInCombat() - enemyUnit.getEvalResInCombat(), 0);
                        targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(d * 0.3);
                    }
                        break;
                    case PassiveC.HokoNoGogeki3:
                        if (targetUnit.moveType === MoveType.Infantry) {
                            DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                    case PassiveC.HokoNoJugeki3:
                        if (targetUnit.moveType === MoveType.Infantry) {
                            DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                }
            }
        }
        for (let unit of this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HokoNoKokyu3:
                        if (targetUnit.moveType === MoveType.Infantry
                            && targetUnit.isPhysicalAttacker()
                        ) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                        break;
                    case PassiveC.HokoNoMajin3:
                        if (!damageCalcEnv.calcPotentialDamage) {
                            if (targetUnit.moveType === MoveType.Infantry
                                && targetUnit.isPhysicalAttacker()
                            ) {
                                targetUnit.atkSpur += 2;
                                targetUnit.spdSpur += 2;
                                targetUnit.battleContext.refersMinOfDefOrRes = true;
                            }
                        }
                        break;
                }
            }
        }
    },

    /// 追撃可能かどうかが条件として必要なスキル効果の適用
    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     * @private
     */
    __applySkillEffectRelatedToFollowupAttackPossibility(targetUnit, enemyUnit, damageCalcEnv) {
        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, damageCalcEnv.calcPotentialDamage);
        env.setName('追撃判定後').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        AFTER_FOLLOW_UP_CONFIGURED_HOOKS.evaluateWithUnit(targetUnit, env);
    },
    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     * @param  {Boolean} calcPotentialDamage
     */
    __applyInvalidationSkillEffect(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let func of targetUnit.battleContext.applyInvalidationSkillEffectFuncs) {
            func(targetUnit, enemyUnit, calcPotentialDamage);
        }
        // 獣の共通武器スキル
        switch (BEAST_COMMON_SKILL_MAP.get(targetUnit.weapon)) {
            case Weapon.TeatimesEdge:
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
                break;
            case PassiveB.BindingNecklacePlus:
                if (enemyUnit.battleContext.initiatesCombat ||
                    this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
                break;
            case Weapon.KishisyogunNoHousou:
                if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
                break;
            case BeastCommonSkillType.Infantry2:
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                }
                break;
            case BeastCommonSkillType.Infantry2IfRefined:
                if (!targetUnit.isWeaponRefined) break;
                if (targetUnit.isTransformed) {
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                }
                break;
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.GetBehindMe:
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.FairFightBlade:
                    if (targetUnit.battleContext.restHpPercentage >= 25 &&
                        enemyUnit.battleContext.initiatesCombat) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.DesertTigerAxe:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.PartnershipBow:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        let count = enemyUnit.getPositiveStatusEffects().length + enemyUnit.getNegativeStatusEffects().length;
                        if (count > 0) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.SyugosyaNoRekkyu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.VassalSaintSteel:
                    if (targetUnit.battleContext.restHpPercentage >= 25 &&
                        targetUnit.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(targetUnit) + 5) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.RevengerLance:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.AiNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined &&
                        targetUnit.battleContext.weaponSkillCondSatisfied) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                    break;
                case Weapon.SacrificeStaff:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case PassiveB.FruitOfLife:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (targetUnit.battleContext.passiveBSkillCondSatisfied) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.TotalWarTome:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                            if (unit.debuffTotal < 0) {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                                break;
                            }
                        }
                    }
                    break;
                case Weapon.BowOfRepose:
                    if (targetUnit.battleContext.restHpPercentage <= 99) {
                        let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                        if (dist >= 2) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.MasterBow:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.GuidesHourglass:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                    break;
                case Special.Enclosure:
                    enemyUnit.battleContext.reducesCooldownCount = false;
                    break;
                case Weapon.SyuryouNoEijin:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.ZekkaiNoSoukyu:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.WindParthia:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                            if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                    }
                    break;
                case Weapon.LunaArc:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.MilasTestament:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.AnkokuNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case Weapon.MaryuHuinNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                    break;
                case Weapon.ThundersMjolnir:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.battleContext.invalidateCooldownCountSkills();
                    }
                    break;
                case Weapon.FiremansHook:
                    if (targetUnit.battleContext.initiatesCombat || this.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.battleContext.invalidatesReduceCooldownCount = true;
                    }
                    break;
                case Weapon.SpendyScimitar:
                    if (targetUnit.battleContext.initiatesCombat && targetUnit.dragonflower >= 2) {
                        targetUnit.battleContext.invalidateCooldownCountSkills();
                    }
                    break;
                case Weapon.WhirlingGrace:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getSpdInCombat() + 1) {
                            targetUnit.battleContext.invalidatesReduceCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.SyunsenAiraNoKen:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.battleContext.invalidateCooldownCountSkills();
                    }
                    break;
                case Weapon.TenteiNoKen:
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                    break;
                case Special.SiriusPlus:
                    enemyUnit.battleContext.reducesCooldownCount = false;
                    break;
                case PassiveB.Velocity3:
                case PassiveB.AtkResTempo3:
                case PassiveB.SpdDefTempo3:
                case PassiveB.SpdResTempo3:
                    targetUnit.battleContext.invalidateCooldownCountSkills();
                    break;
                case PassiveB.SolarBrace2:
                case PassiveB.MoonlightBangle:
                case PassiveB.MoonlitBangleF:
                    targetUnit.battleContext.invalidatesReduceCooldownCount = true;
                    break;
                case PassiveC.FaithInHumanity: {
                    let count = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                        if (!isWeaponTypeBreathOrBeast(unit.weaponType) && unit.buffTotal >= 10) {
                            count++
                        }
                    }
                    if (count >= 2) {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                    break;
                }
            }
        }
    },


    /**
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {DamageCalcEnv} damageCalcEnv
     */
    __applySpecialSkillEffect(targetUnit, enemyUnit, damageCalcEnv) {
        let env =
            new DamageCalculatorWrapperEnv(this, targetUnit, enemyUnit, false);
        env.setName('戦闘開始時奥義効果').setLogLevel(getSkillLogLevel()).setDamageType(damageCalcEnv.damageType)
            .setCombatPhase(this.combatPhase).setGroupLogger(damageCalcEnv.getCombatLogger());
        WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS.evaluateWithUnit(targetUnit, env);
        let func = this._applySpecialSkillEffectFuncDict[targetUnit.special];
        if (func) {
            func(targetUnit, enemyUnit);
        }
    },

    __setSkillEffetToContext(atkUnit, defUnit) {
        this.__setBothOfAtkDefSkillEffetToContext(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContext(defUnit, atkUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit);
        this.__setBothOfAtkDefSkillEffetToContextForEnemyUnit(defUnit, atkUnit);

        let canAtkUnitDisableAttackPrioritySkills =
            atkUnit.canDisableAttackOrderSwapSkill(atkUnit.battleContext.restHpPercentage, defUnit) ||
            atkUnit.battleContext.canUnitDisableSkillsThatChangeAttackPriority;
        let canDefUnitDisableAttackPrioritySkills =
            defUnit.canDisableAttackOrderSwapSkill(defUnit.battleContext.restHpPercentage, atkUnit) ||
            defUnit.battleContext.canUnitDisableSkillsThatChangeAttackPriority;
        if (!canAtkUnitDisableAttackPrioritySkills &&
            !canDefUnitDisableAttackPrioritySkills) {
            atkUnit.battleContext.isDesperationActivated = atkUnit.battleContext.isDesperationActivatable || atkUnit.hasStatusEffect(StatusEffectType.Desperation);
            defUnit.battleContext.isVantageActivated = defUnit.battleContext.isVantageActivatable || defUnit.hasStatusEffect(StatusEffectType.Vantage);

            defUnit.battleContext.isDefDesperationActivated = defUnit.battleContext.isDefDesperationActivatable;

            if (this.isLogEnabled) {
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
        } else {
            atkUnit.battleContext.isDesperationActivated = false;
            defUnit.battleContext.isVantageActivated = false;
        }
    },

    __setBothOfAtkDefSkillEffetToContext(targetUnit, enemyUnit) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.SparklingSun:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        if (enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(75 / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.MagetsuNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.isOddTurn || enemyUnit.battleContext.restHpPercentage < 100) {
                            let percentage = enemyUnit.battleContext.canFollowupAttackIncludingPotent() ? 60 : 30;
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(percentage / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.StarlightStone:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        if (enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(75 / 100.0, enemyUnit);
                        }
                    }
                    break;
                case Weapon.MaryuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                            if (enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.70, enemyUnit);
                            }
                        }
                    }
                    break;
                case Weapon.SeaSearLance:
                    if ((enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) &&
                        enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.75, enemyUnit);
                    }
                    break;
                case Weapon.StoutLancePlus:
                case Weapon.StoutAxePlus:
                case Weapon.CourtlyMaskPlus:
                case Weapon.CourtlyBowPlus:
                case Weapon.CourtlyCandlePlus:
                    if (targetUnit.battleContext.restHpPercentage >= 50 &&
                        enemyUnit.battleContext.canFollowupAttackIncludingPotent()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
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
                case PassiveB.BlackEagleRule:
                    if (!targetUnit.battleContext.initiatesCombat && targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.8, enemyUnit);
                    }
                    break;
                case PassiveB.SeikishiNoKago:
                    if (isRangedWeaponType(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfConsecutiveAttacks(0.8, enemyUnit);
                    }
                    break;
                case PassiveS.RengekiBogyoKenYariOno3:
                    if (enemyUnit.weaponType === WeaponType.Sword ||
                        enemyUnit.weaponType === WeaponType.Lance ||
                        enemyUnit.weaponType === WeaponType.Axe) {
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
    },

    __setBothOfAtkDefSkillEffetToContextForEnemyUnit(atkUnit, defUnit) {
        if (atkUnit.hasPassiveSkill(PassiveB.Cancel3)) {
            if (atkUnit.battleContext.restHpPercentage >= 80) {
                defUnit.battleContext.cooldownCount = 1;
            }
        }
    },
});
