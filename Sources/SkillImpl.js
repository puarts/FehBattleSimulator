// noinspection JSUnusedLocalSymbols
// 各スキルの実装
// 邪痕と聖痕の竜血
{
    let skillId = Weapon.DraconicPacts;
    // 威力：14射程：2
    // 奥義が発動しやすい（発動カウントー1）
    // 応援、移動系補助（体当たり、引き戻し、回り込み等）を使用した時、または自分に使用された時、
    // - 自身の奥義発動カウントー1、
    // - 移動後の自分を中心とした縦3列と横3列の敵に【七色の囁き】を付与（敵の次回行動終了時まで）
    // 【七色の囁き】
    // 戦闘中、攻撃、速さ、守備、魔防ー5となる状態異常
    // さらに、自分が攻撃時に発動する奥義を装備している時、
    // - 戦闘中、自分の最初の攻撃前に自分の奥義発動カウント＋1（奥義発動カウントの最大値は超えない）
    // - さらに、自分の奥義発動カウントの最大値が本来より減少している時（奥義が発動しやすい時）、かつ敵が攻撃時に発動する奥義を装備している時、
    // - 戦闘中、自分の最初の攻撃前に敵の奥義発動カウントー1
    /** @type {(this: BattleSimulatorBase, skillOwner: Unit, ally: Unit) => void} */
    let func = function (skillOwner, ally) {
        skillOwner.reduceSpecialCount(1);
        let enemies = this.enumerateUnitsInDifferentGroupOnMap(skillOwner);
        for (let enemy of enemies) {
            if (enemy.isInCrossWithOffset(skillOwner, 1) ||
                enemy.isInCrossWithOffset(ally, 1)) {
                enemy.addStatusEffect(StatusEffectType.HushSpectrum);
            }
        }
    };
    // 使用した時
    applySkillsAfterRallyForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit) {
            func.call(this, supporterUnit, targetUnit);
        }
    );
    // 使用された時
    applySkillsAfterRallyForTargetUnitFuncMap.set(skillId,
        function (supporterUnit, targetUnit) {
            func.call(this, targetUnit, supporterUnit);
        }
    );
    applyMovementAssistSkillFuncMap.set(skillId,
        function (skillOwner, ally) {
            func.call(this, skillOwner, ally);
        }
    );
    // 応援、移動系補助（体当たり、引き戻し、回り込み等）を使用した時、または、行動済みの自分に使用された時、
    // - 自分を行動可能にする（1ターンに1回のみ）
    let actionFunc = skillOwner => {
        if (!skillOwner.isActionDone) {
            return;
        }
        if (!skillOwner.isOneTimeActionActivatedForWeapon) {
            skillOwner.isOneTimeActionActivatedForWeapon = true;
            skillOwner.isActionDone = false;
        }
    };
    applySupportSkillForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit, supportTile) {
            actionFunc(supporterUnit);
        }
    );
    applySupportSkillForTargetUnitFuncMap.set(skillId,
        function (supporterUnit, targetUnit, supportTile) {
            actionFunc(targetUnit);
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                // - 戦闘中、攻撃、速さ、守備、魔防が16一敵の奥義発動カウントの最大値x2だけ増加（最低8、敵が奥義を装備していない時も8）、
                let amount = MathUtil.ensureMin(16 - targetUnit.maxSpecialCount * 2, 8);
                if (enemyUnit.special === Special.None) {
                    amount = 8;
                }
                targetUnit.addAllSpur(amount);
                // - 最初に受けた攻撃と2回攻撃のダメージを30%軽減、
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.3, enemyUnit);
                // - 自身の奥義発動カウント変動量ーを無効
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
    );
}

// 秘奥
{
    /** @type {(skillId: number, spurs: [number, number, number, number], canHeal : boolean) => void} */
    let setSkill = (skillId, spurs, canHeal = false) => {
        applySkillEffectsPerAttackFuncMap.set(skillId,
            function (targetUnit, enemyUnit, canActivateAttackerSpecial) {
                // 秘奥共通効果
                if (targetUnit.battleContext.passiveASkillCondSatisfied) {
                    let isSpecialCharged = targetUnit.hasSpecial && targetUnit.tmpSpecialCount === 0;
                    if (isSpecialCharged || targetUnit.battleContext.isSpecialActivated) {
                        targetUnit.battleContext.additionalDamagePerAttack += 5;
                        if (canHeal) {
                            targetUnit.battleContext.healedHpByAttackPerAttack += 7;
                        }
                    }
                }
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    targetUnit.battleContext.passiveASkillCondSatisfied = true;
                    targetUnit.addSpurs(...spurs);
                }
            }
        );
    }
    // 秘奥3
    setSkill(PassiveA.AtkSpdFinish3, [6, 6, 0, 0]);
    setSkill(PassiveA.AtkDefFinish3, [6, 0, 6, 0]);
    setSkill(PassiveA.AtkResFinish3, [6, 0, 0, 6]);
    setSkill(PassiveA.SpdResFinish3, [0, 6, 0, 6]);
    setSkill(PassiveA.DefResFinish3, [0, 0, 6, 6]);
    // 秘奥4
    setSkill(PassiveA.AtkSpdFinish4, [7, 7, 0, 0], true);
    setSkill(PassiveA.AtkDefFinish4, [7, 0, 7, 0], true);
    setSkill(PassiveA.AtkResFinish4, [7, 0, 0, 7], true);
    setSkill(PassiveA.SpdResFinish4, [0, 7, 0, 7], true);
    setSkill(PassiveA.DefResFinish4, [0, 0, 7, 7], true);
}

// 戦神の戦斧
{
    let skillId = Weapon.NewWarAxe;
    // 威力：16射程：1
    // 奥義が発動しやすい（発動カウントー1）
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 周囲3マス以内に味方がいる時、
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                // - 戦闘中、攻撃、守備、魔防が、戦闘開始時の敵の攻撃の25%-4だけ増加（最大14、最低5）、
                let amount = MathUtil.ensureMinMax(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25 - 4), 5, 14);
                targetUnit.addAllSpur(amount);
                // - 敵の奥義発動カウント変動量＋を無効、
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                );
                // - かつ自身の奥義発動カウント変動量ーを無効、
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                // - 自分の【回復不可」を50%無効、
                targetUnit.battleContext.nullInvalidatesHealRatio = 0.5;
                // - 敵から受けた追撃のダメージを80%軽減（追撃：通常の攻撃は、2回目の攻撃「2回攻撃」は、3～4回目の攻撃）、
                targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.8, enemyUnit);
            }
        }
    );
    // - かつ戦闘中、攻撃時に発動する奥義発動時、
    applySkillEffectsPerAttackFuncMap.set(skillId,
        function (targetUnit, enemyUnit, canActivateAttackerSpecial) {
            if (isNormalAttackSpecial(targetUnit.special)) {
                let percentage = 10 + targetUnit.maxSpecialCount * 10;
                let ratio = percentage / 100.0;
                let amount = Math.trunc(targetUnit.getDefInCombat(enemyUnit) * ratio);
                //     - 自身のHPが70%以上なら、
                //         - ダメージ＋●、
                //     - 自身のHPが70%未満なら、
                //         - 自分のHP●回復、
                //     - ●は、守備の（10+奥義発動カウント最大値x10）％（範囲奥義を除く）
                if (targetUnit.restHpPercentage >= 70) {
                    targetUnit.battleContext.damageReductionValuePerAttack += amount;
                } else {
                    targetUnit.battleContext.healedHpByAttackPerAttack += amount;
                }
            }
        }
    );
}

// 戦神の聖杖
{
    let skillId = Weapon.ExaltsWarStaff;
    // 射程：2
    // 威力：14
    // 敵は反撃不可
    // 奥義が発動しやすい（発動カウントー1）（奥義発動カウント最大値の下限は1）

    // 自身のHPが60%以下の時、または、現在のターン中に自分が「戦闘を行っているか、補助スキルを使用している」時、
    // - 味方は、自身の周囲2マス以内に移動可能
    enumerateTeleportTilesForAllyFuncMap.set(skillId,
        function* (targetUnit, allyUnit) {
            if (allyUnit.hpPercentage <= 60 ||
                allyUnit.isCombatDone || allyUnit.isSupportDone) {
                yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(allyUnit.placedTile, targetUnit, 2);
            }
        }
    );

    // 周囲3マス以内の味方は、
    // - 戦闘中、攻撃、速さ、守備、魔防＋4、
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, calcPotentialDamage, enemyUnit) {
            if (targetUnit.distance(allyUnit) <= 3) {
                targetUnit.addAllSpur(4);
            }
        }
    );
    // - 戦闘後、7回復
    applySkillEffectFromAlliesExcludedFromFeudFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (targetUnit.distance(allyUnit) <= 3) {
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 周囲3マス以内に味方がいる時、
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                // - 戦闘中、自身の攻撃、魔防＋6、
                targetUnit.addAtkResSpurs(6);
                // - 絶対追撃、
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                // - ダメージ＋魔防の20％（範囲奥義を除く）
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    this.addFixedDamageByStatus(atkUnit, defUnit, StatusIndex.Res, 0.2);
                });
            }
        }
    );
}

// 奥の手・魔道4
{
    let skillId = PassiveB.MagicGambit4;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 自分から攻撃した時、または、敵が射程2の時、
            if (targetUnit.battleContext.initiatesCombat ||
                isRangedWeaponType(enemyUnit.weaponType)) {
                // - 戦闘中、敵の速さ、魔防ー4、
                enemyUnit.addSpdResSpurs(-4);
                // - かつ攻撃時発動の奥義装備時、または、敵から攻撃を受ける際に発動する奥義装備時、
                let special = targetUnit.special;
                if (isNormalAttackSpecial(special) || isDefenseSpecial(special)) {
                    //     - 戦闘中、ダメージ＋（自分の奥義発動カウントの最大値-2）x4（最大12、最低0、範囲奥義を除く）、
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) return;
                        let amount = (atkUnit.maxSpecialCount - 2) * 4;
                        atkUnit.battleContext.additionalDamage += MathUtil.ensureMinMax(amount, 0, 12);
                    });
                    //     - 受けた範囲奥義のダメージと、戦闘中に攻撃を受けた時のダメージを（自分の奥義発動カウントの最大値-1）x10%軽減（最大40%）（巨影の範囲奥義を除く）
                    targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                        return MathUtil.ensureMax((targetUnit.maxSpecialCount - 1) * 0.1, 0.4);
                    });
                }
            }
        }
    );
    //     - 受けた範囲奥義のダメージと、戦闘中に攻撃を受けた時のダメージを（自分の奥義発動カウントの最大値-1）x10%軽減（最大40%）（巨影の範囲奥義を除く）
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (defUnit.battleContext.initiatesCombat ||
                isRangedWeaponType(atkUnit.weaponType)) {
                let special = defUnit.special;
                if (isNormalAttackSpecial(special) || isDefenseSpecial(special)) {
                    let ratio = MathUtil.ensureMax((defUnit.maxSpecialCount - 1) * 0.1, 0.4);
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                }
            }
        }
    );
}

// 戦神の魔書
{
    let skillId = Weapon.FellWarTome;
    // 射程：2
    // 威力：14
    // 速さ＋3
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 自分から攻撃した時、または、周囲2マス以内に味方がいる時、
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                // - 戦闘中、攻撃、速さ、守備、魔防が16一敵の奥義発動カウントの最大値x2だけ増加（最低8、敵が奥義を装備していない時も8）、
                let amount = MathUtil.ensureMin(16 - enemyUnit.maxSpecialCount * 2, 8);
                if (enemyUnit.special === Special.None) {
                    amount = 8;
                }
                targetUnit.addAllSpur(amount);
                // - 最初に受けた攻撃と2回攻撃のダメージを30%軽減、
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.3, enemyUnit);
                // - 自身の奥義発動カウント変動量ーを無効、
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                // - かつ自身の奥義発動カウント最大値が3以上の攻撃時発動する奥義が発動した時、
                //     - 奥義以外のスキルによる「ダメージを〇〇%軽減」を無効（範囲奥義を除く）
                if (targetUnit.maxSpecialCount >= 3 && isNormalAttackSpecial(targetUnit.special)) {
                    targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                }
            }
        }
    );
    // 自分から攻撃した時、戦闘後、敵のマスと
    // - 自分から見た敵のマスの左右それぞれ2マスに【天脈・炎】を付与（1ターン）
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.initiatesCombat) {
                this.__applyFlaredSkillEffect(targetUnit, enemyUnit);
            }
        }
    );
    // - 戦闘開始後、敵に7ダメージ（戦闘で攻撃可能な時のみ発動）（戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1）、
    applySkillEffectRelatedToFollowupAttackPossibilityFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.canAttackInCombat()) {
                let damage = 7;
                let skillName = DebugUtil.getSkillName(targetUnit, targetUnit.weaponInfo);
                this.writeDebugLog(`${skillName}により戦闘開始後ダメージ+${damage}。`);
                enemyUnit.battleContext.damageAfterBeginningOfCombat += damage;
            }
        }
    );
}

// マジックシールド+
{
    let skillId = Support.MagicShieldPlus;
    // TODO: 検証する
    PRECOMBAT_HEAL_THRESHOLD_MAP.set(skillId, 10);
    getAssistTypeWhenCheckingCanActivatePrecombatAssistFuncMap.set(skillId, _ => AssistType.Heal);
    // このスキルは「応援」として扱われる
    RALLY_HEAL_SKILL_SET.add(skillId);
    // TODO: 検証する。とりあえずプレーヤーなら強制的に応援できる。
    canRallyForciblyByPlayerFuncMap.set(skillId, _ => true);
    // 対象を攻撃の50%回復（最低8）し、
    calcHealAmountFuncMap.set(skillId,
        function (supporterUnit, supportTargetUnit) {
            return MathUtil.ensureMin(Math.trunc(supporterUnit.getAtkInPrecombat() * 0.5), 8);
        }
    );
    // 対象の攻撃、魔防＋6、
    RALLY_BUFF_AMOUNT_MAP.set(skillId, [6, 0, 0, 6]);
    // 「弱化を無効」を付与（1ターン）、
    applySupportSkillForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit, supportTile) {
            targetUnit.addStatusEffect(StatusEffectType.NeutralizesPenalties);
            // 2ターン目以降なら、
            if (g_appData.currentTurn >= 2) {
                this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果発動可能まで残り${supporterUnit.restSupportSkillAvailableTurn}ターン`);
                if (supporterUnit.restSupportSkillAvailableTurn === 0) {
                    this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果が発動`);
                    if (!supporterUnit.isOneTimeActionActivatedForSupport &&
                        supporterUnit.isActionDone) {
                        supporterUnit.isOneTimeActionActivatedForSupport = true;

                        // その後、自分を行動可能にし、自分とダブル相手に移動を最大1マスに制限する状態異常を付与（次回行動終了時まで）
                        supporterUnit.isActionDone = false;
                        supporterUnit.addStatusEffect(StatusEffectType.Gravity);
                        this.writeLogLine(`${supporterUnit.getNameWithGroup()}は${supporterUnit.supportInfo.name}により再行動`);

                        // （「その後」以降の効果は、その効果が発動後2ターンの間発動しない）
                        supporterUnit.restSupportSkillAvailableTurn = 2;
                        this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果発動可能まで残り${supporterUnit.restSupportSkillAvailableTurn}ターン`);
                    }
                } else {
                    this.writeSimpleLogLine(`${supporterUnit.nameWithGroup}の補助スキル効果は発動せず`);
                }
            }
        }
    );
    canAddStatusEffectByRallyFuncMap.set(skillId,
        function (supporterUnit, targetUnit) {
            return !targetUnit.hasStatusEffect(StatusEffectType.NeutralizesPenalties);
        }
    );
    // （このスキル使用時の奥義発動カウント変動量は常に0、経験値、SPも入手できない）
    noEffectOnSpecialCooldownChargeOnSupportSkillSet.add(skillId);
}

// ハデスΩ
{
    let skillId = Weapon.HadesuOmega;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.addAtkSpdSpurs(4);
                    if (targetUnit.hasSpecial &&
                        targetUnit.statusEvalUnit.specialCount === 0) {
                        targetUnit.atkSpur += 6;
                    }
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
}

// 狼花嫁の牙
{
    let skillId = Weapon.BridesFang;
    WeaponTypesAddAtk2AfterTransform[skillId] = 0;
    BeastCommonSkillMap.set(skillId, BeastCommonSkillType.Infantry);
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.addSpursWithoutRes(-5);
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applyAttackSkillEffectAfterCombatFuncMap.set(skillId,
        function (attackUnit, attackTargetUnit) {
            if (!attackUnit.weaponRefinement) {
                if (attackUnit.battleContext.isSpecialActivated) {
                    attackUnit.specialCount -= 1;
                }
            }
        }
    );
}

// ダニエルの錬弓
{
    let skillId = Weapon.DanielMadeBow;
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // 周囲2マス以内
                if (targetUnit.distance(allyUnit) <= 2) {
                    targetUnit.atkSpur += 5;
                }
            }
        }
    );
    updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            // enemyAllyUnitからのスキルなので錬成判定に注意
            if (!enemyAllyUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.distance(enemyAllyUnit) <= 2) {
                    targetUnit.atkSpur -= 5;
                }
            } else {
                // <錬成効果>
                if (enemyAllyUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
}

// 暗黒の聖書
{
    let skillId = Weapon.DarkScripture;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (calcPotentialDamage ||
                    !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                    enemyUnit.addAtkResSpurs(-6);
                }
                if (!enemyUnit.hasEffective(EffectiveType.Dragon)) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
}

// 星竜のブレス
{
    let skillId = Weapon.AstralBreath;
    TeleportationSkillDict[skillId] = 0;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (!calcPotentialDamage && this.__isTherePartnerInSpace3(targetUnit)) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    enumerateTeleportTilesForUnitFuncMap.set(skillId,
        function* (unit) {
            if (!unit.isWeaponRefined) {
                for (let ally of this.enumerateUnitsInTheSameGroup(unit)) {
                    if (ally.isPartner(unit)) {
                        yield* ally.placedTile.getMovableNeighborTiles(unit, 1, false, true);
                    }
                }
            }
        }
    );
}

// 紋章士アイク
{
    let skillId = getEmblemHeroSkillId(EmblemHero.Ike);
    applyDamageReductionRatiosWhenCondSatisfiedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            // 「自分または敵が奥義発動可能状態の時」、「この戦闘（戦闘前、戦闘中）で自分または敵が奥義発動済みの時」の
            // 2条件のいずれかを満たした時、
            if (defUnit.tmpSpecialCount === 0 ||
                atkUnit.tmpSpecialCount === 0 ||
                defUnit.battleContext.isSpecialActivated ||
                atkUnit.battleContext.isSpecialActivated) {
                // かつ、敵が射程2の時、
                if (isRangedWeaponType(atkUnit.weaponType)) {
                    // 戦闘中、受けた攻撃のダメージを40%軽減（1戦闘1回のみ）（範囲奥義を除く）
                    defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.4);
                }
            }
        }
    );
}

// 不動4
{
    let skillId = PassiveB.LaguzFriend;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 戦闘中、敵の攻撃－5
            enemyUnit.atkSpur -= 5;
            // 自身の奥義発動カウント最大値が3以上の攻撃時に発動する奥義装備時、
            // または、敵から攻撃を受ける際に発動する奥義装備時、
            let attackSpecialCond = isNormalAttackSpecial(targetUnit.special) && targetUnit.maxSpecialCount >= 3;
            let defenseSpecialCond = isDefenseSpecial(targetUnit.special);
            if (attackSpecialCond || defenseSpecialCond) {
                // - 戦闘中、自分の奥義以外のスキルによる「ダメージを〇〇％軽減」を半分無効（無効にする数値は端数切捨て）（範囲奥義を除く）、
                enemyUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                // - 自分が受けるダメージー守備か魔防の高い方の20％（範囲奥義を除く）、
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        this.applyDamageReductionByOwnStatus(targetUnit, enemyUnit, [false, false, true, true]);
                    }
                );
                // - 敵の最初の攻撃前に自分の奥義発動カウントー2
                targetUnit.battleContext.specialCountReductionBeforeFirstAttackByEnemy += 2;
            }
            // 戦闘中、自身の奥義発動カウント最大値が3以上の攻撃時に発動する奥義発動時、
            if (attackSpecialCond) {
                // - ダメージ＋守備か魔防の高い方の20％（範囲奥義を除く）、
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let status = targetUnit.getHighestStatusInCombat(enemyUnit, [false, false, true, true]);
                        targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.2));
                    }
                );
                // - 敵の奥義以外のスキルによる「ダメージを〇〇％軽減」を無効（範囲奥義を除く）
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
            // 戦闘中、敵から攻撃を受ける際に発動する奥義発動時、
            if (defenseSpecialCond) {
                // - 自分の次の攻撃は、
                //     - 敵の奥義以外のスキルによる「ダメージを〇〇％軽減」を無効（その戦闘中のみ）
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttackAfterDefenderSpecial = true;
            }
        }
    );

    // 奥義発動後、自分の次の攻撃のスキル効果を発動
    activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            defUnit.battleContext.nextAttackEffectAfterSpecialActivated = true;
        }
    );

    addSpecialDamageAfterDefenderSpecialActivatedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            // - 自分の次の攻撃は、
            //     - ダメージ＋守備か魔防の高い方の20％、
            if (atkUnit.battleContext.nextAttackEffectAfterSpecialActivated) {
                atkUnit.battleContext.nextAttackEffectAfterSpecialActivated = false;
                let status = atkUnit.getHighestStatusInCombat(defUnit, [false, false, true, true]);
                return floorNumberWithFloatError(status * 0.2);
            }
            return 0;
        }
    );
}

// 覇克・天空
{
    let skillId = Special.GreatAether;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count4Specials.push(skillId);
    inheritableCount4Specials.push(skillId);

    applySkillEffectsPerCombatFuncMap.set(skillId,
        function (targetUnit, enemyUnit, context) {
            // 攻撃の（40+敵がこの戦闘中に攻撃した回数x10）％を奥義ダメージに加算
            let count = context.getAttackLogs(enemyUnit).length;
            let status = targetUnit.getAtkInCombat(enemyUnit);
            let specialAddDamage = Math.trunc(status * (0.4 + count * 0.1));
            targetUnit.battleContext.addSpecialAddDamagePerAttack(specialAddDamage);
            this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.specialInfo.name}によりダメージを${specialAddDamage}追加。status: ${status}, atk count: ${count}`);
        }
    );

    applySpecialDamageReductionPerAttackFuncMap.set(skillId,
        function (targetUnit, enemyUnit, context) {
            // 戦闘中、攻撃を受けた時のダメージを（40-現在の奥義発動カウントx10）％軽減、
            // ただし、連続して攻撃を受けた時の2回目以降のダメージは（70ー現在の奥義発動カウントx10）％軽減
            let basePercentage = context.isConsecutiveAttack(enemyUnit) ? 70 : 40;
            let percentage = basePercentage - targetUnit.tmpSpecialCount * 10;
            this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.specialInfo.name}により${percentage}%軽減, base percentage: ${basePercentage}, count: ${targetUnit.tmpSpecialCount}`);
            targetUnit.battleContext.damageReductionRatiosBySpecialPerAttack.push(percentage / 100.0);
        }
    );

    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            // 戦闘で奥義を発動した場合、戦闘後、
            if (targetUnit.battleContext.isSpecialActivated) {
                // 自身を中心とした縦3列と横3列にいる敵に
                /** @type {Generator<Unit>} */
                let units = this.enumerateUnitsInDifferentGroupOnMap(targetUnit);
                let count = 0;
                for (let unit of units) {
                    if (unit.isInCrossWithOffset(targetUnit, 1)) {
                        count++;
                        // 5ダメージ、
                        unit.reserveTakeDamage(5);
                        // 奥義発動カウント＋1（奥義発動カウントの最大値は超えない）、
                        unit.increaseSpecialCount(1);
                    }
                }
                // 自分は、HPが回復
                // 回復値は、自身を中心とした縦3列と横3列にいる敵の数x5＋10（上限：自身の最大HPの50％）
                let maxAmount = Math.trunc(targetUnit.maxHpWithSkills * 0.5);
                let amount = MathUtil.ensureMax(count * 5 + 10, maxAmount);
                targetUnit.reserveHeal(amount);
            }
        }
    );

    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 自分から攻撃した時、敵は先制攻撃
            if (targetUnit.battleContext.initiatesCombat) {
                enemyUnit.battleContext.isVantageActivatable = true;
            }
            // 敵が追撃可能なら、敵の攻撃の直後に敵が追撃を行う
            enemyUnit.battleContext.isDesperationActivatable = true;
            enemyUnit.battleContext.isDefDesperationActivatable = true;
        }
    );
}

// 蒼炎の勇者の剣
{
    let skillId = Weapon.EmblemRagnell;
    // 奥義が発動しやすい（発動カウントー1）
    // 敵から攻撃された時、距離に関係なく反撃する
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 戦闘開始時、自身のHPが25%以上なら、
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                // 戦闘中、自身の攻撃＋●、敵の攻撃一〇、
                // ●は、戦闘開始時の敵の攻撃の25%-2（最大16、最低6）、
                let atk = enemyUnit.getAtkInPrecombat();
                let amount = MathUtil.ensureMinMax(Math.trunc(atk * 0.25) - 2, 6, 16);
                targetUnit.atkSpur += amount;
                enemyUnit.atkSpur -= amount;
                // 自身の弱化を無効、自身の反撃不可を無効、自身の奥義発動カウント変動量ーを無効
                targetUnit.battleContext.invalidateAllOwnDebuffs();
                targetUnit.battleContext.nullCounterDisrupt = true;
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
    );
}

// 毒の葬り手の牙
{
    let skillId = Weapon.DosingFang;
    // 奥義が発動しやすい(発動カウント-1)
    // 自軍ターン開始時、および、敵軍ターン開始時、自身を中心とした縦3列と横3列の敵の攻撃、守備-7、【混乱】を付与(敵の次回行動終了時まで)
    let func = function (skillOwner) {
        /** @type {Generator<Unit>} */
        let units = this.enumerateUnitsInDifferentGroupOnMap(skillOwner);
        for (let unit of units) {
            if (unit.isInCrossWithOffset(skillOwner, 1)) {
                unit.reserveToApplyBuffs(-7, 0, -7, 0);
                unit.reserveToAddStatusEffect(StatusEffectType.Sabotage);
            }
        }
    };
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId, func);
    applyEnemySkillForBeginningOfTurnFuncMap.set(skillId, func);
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                // 戦闘開始時、自身のHPが25%以上なら、戦闘開始後、敵に8ダメージ(他の「戦闘開始後、敵に○ダメージ」の効果とは重複せず最大値適用)(戦闘中にダメージを減らす効果の対象外、ダメージ後のHPは最低1)
                enemyUnit.battleContext.addDamageAfterBeginningOfCombatNotStack(8);
                // 戦闘開始時、自身のHPが25%以上なら、戦闘中、敵の攻撃、守備が、戦闘開始時の自分の守備の20%+6だけ減少
                let amount = Math.trunc(targetUnit.getDefInPrecombat() * 0.2 + 6);
                enemyUnit.addAtkDefSpurs(-amount);
                // 戦闘開始時、自身のHPが25%以上なら、戦闘中、敵の奥義以外のスキルによる「ダメージを○○%軽減」を半分無効(無効にする数値は端数切捨て)(範囲奥義を除く)、
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                // ダメージ+敵の最大HPの30%(範囲奥義を除く)、
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    atkUnit.battleContext.additionalDamage += Math.trunc(enemyUnit.maxHpWithSkills * 0.3);
                });
            }
        }
    );
    // 受けるダメージ-○、
    // かつ、敵の奥義による攻撃の時、さらに、受けるダメージ-○(○は、敵のHP減少量、最大20)(範囲奥義を除く)
    applySkillEffectsPerAttackFuncMap.set(skillId,
        function (targetUnit, enemyUnit, canActivateAttackerSpecial) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let amount = MathUtil.ensureMax(enemyUnit.maxHpWithSkills - enemyUnit.restHp, 20);
                this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.weaponInfo.name}のスキル効果により${amount}減少。敵HP: ${enemyUnit.restHp}/${enemyUnit.maxHpWithSkills}`);
                targetUnit.battleContext.damageReductionValuePerAttack += amount;
                targetUnit.battleContext.damageReductionValueOfSpecialAttackPerAttack += amount;
            }
        }
    );
    // ターン開始時、竜、獣以外の味方と隣接していない場合、化身状態になる(そうでない場合、化身状態を解除)化身状態なら、攻撃+2、かつ敵から攻撃された時、距離に関係なく反撃する
    WeaponTypesAddAtk2AfterTransform[skillId] = 0;
    BeastCommonSkillMap.set(skillId, BeastCommonSkillType.Armor);
}

// 禿鷹の弓+
{
    let skillId = Weapon.VultureBowPlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 飛行特効
            // 周囲1マス以内に味方がいない時、
            if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                // 戦闘中、敵の攻撃、守備-5、
                enemyUnit.addAtkDefSpurs(-5);
                // かつ敵が攻撃、守備の弱化を受けていれば、戦闘中、敵の攻撃、守備が弱化の値だけ減少(能力値ごとに計算)(例えば、攻撃-7の弱化を受けていれば、-7-7-5で、戦闘中、攻撃-19となる)
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                );
            }
        }
    );
}

// 2種類封じ3
{
    let setSkill = (skillId, spurIndices, spurAmount = 3, spurMax = 6, debuffAmount = 6) => {
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                // 戦闘中、敵の速さ、魔防一3、
                enemyUnit.addSpurs(...spurIndices.map(n => n * -spurAmount));

                // さらに、敵の速さ、魔防がそれぞれ減少
                // 減少値は、6一敵が受けているその能力値の弱化の値
                // （最低値O、
                // 敵が弱化無効の効果を発動していても減少）
                let debuffValues = enemyUnit.getDebuffTotals(true).map(n => Math.abs(n));
                let spurFunc = (n, i) => -n * MathUtil.ensureMin(spurMax - debuffValues[i], 0);
                enemyUnit.addSpurs(...spurIndices.map(spurFunc));

                // 敵が速さ、魔防のいずれかの弱化を受けている時、
                // 戦闘中、敵の奥義発動カウント変動量ー1
                // （同系統効果複数時、最大値適用）
                let debuffTotals = enemyUnit.debuffTotals;
                let areDebuffedSomeStatuses = spurIndices.some((n, i) => n !== 0 && debuffTotals[i] < 0);
                if (areDebuffedSomeStatuses) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        );
        // 戦闘後、敵の速さ、魔防－6（敵の次回行動終了時まで）
        applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit) {
                enemyUnit.applyDebuffs(...spurIndices.map(n => n * -debuffAmount));
            }
        );
    }
    // 速さ魔防
    setSkill(PassiveB.SealSpdRes3, [0, 1, 0, 1]);
}

// 神聖風
{
    let skillId = Special.SacredWind;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count2Specials.push(skillId);
    inheritableCount2Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            // 速さの40%を奥義ダメージに加算
            let status = targetUnit.getSpdInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.4));
            // 奥義発動時、奥義以外のスキルによる「ダメージを〇〇%軽減」を無効
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        }
    );

    applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap.set(skillId,
        function (attackUnit, attackTargetUnit) {
            if (attackUnit.battleContext.isSpecialActivated) {
                // 奥義を発動した戦闘後、自分と全味方のHP20回復（一つの戦闘で複数回発動時、回復効果は重複しない）
                // （その戦闘で自分のHPが0になっても効果は発動）、
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true);
                for (let unit of units) {
                    if (unit.isDead) continue;
                    unit.heal(20);
                }
                // 自分に【再移動（1）】を付与（1ターン）
                attackUnit.addStatusEffect(StatusEffectType.Canto1);
            }
        }
    );
}

// 柔風エクスカリバー
{
    let skillId = Weapon.TenderExcalibur;
    // 飛行特効
    // 奥義が発動しやすい（発動カウントー1）

    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                // 戦闘開始時、自身のHPが25%以上なら、戦闘中、攻撃、速さ、守備、魔防＋5、
                targetUnit.addAllSpur(5);
                // さらに、攻撃、速さが、
                // 9-HPが40%以下の味方の数だけ増加（最低0）、
                let count = 0;
                /** @type {Generator<Unit>} */
                let units = this.enumerateUnitsInTheSameGroupOnMap(targetUnit);
                for (let unit of units) {
                    if (unit.battleContext.restHpPercentage <= 40) {
                        count++;
                    }
                }
                let amount = MathUtil.ensureMin(9 - count, 0);
                targetUnit.addAtkSpdSpurs(amount);
                // 敵の絶対追撃を無効、かつ、自分の追撃不可を無効、
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                // 最初に受けた攻撃と2回攻撃のダメージを30%軽減
                // （最初に受けた攻撃と2回攻撃：
                // 通常の攻撃は、1回目の攻撃のみ「2回攻撃」は、1～2回目の攻撃）
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.3, enemyUnit);
                // 戦闘開始時、自身のHPが25%以上の時、かつ攻撃時に発動する奥義を装備している時、
                // 戦闘中、自分の最初の攻撃前に奥義発動カウントー1、自分の最初の追撃前に奥義発動カウントー1
                if (isNormalAttackSpecial(targetUnit.special)) {
                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
                    targetUnit.battleContext.specialCountReductionBeforeFollowupAttack += 1;
                }
            }
        }
    );
}

// 激雷の書
{
    let skillId = Weapon.LightburstTome;
    // 奥義が発動しやすい（発動カウントー1）

    // ターン開始時、自身のHPが25%以上なら、自分と周囲2マス以内の味方の攻撃、速さ、守備＋6、
    // 「自分が移動可能な地形を平地のように移動可能」
    // を付与（1ターン）
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                /** @type {Generator<Unit>} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true);
                for (let unit of units) {
                    unit.reserveToApplyBuffs(6, 6, 6, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                }
            }
        }
    );

    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 戦闘開始時、自身のHPが25%以上の時、かつ攻撃時に発動する奥義を装備している時、
            // 戦闘中、自分の最初の攻撃前に奥義発動カウントー1
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                if (isNormalAttackSpecial(targetUnit.special)) {
                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
                }
                // 戦闘開始時、自身のHPが25%以上なら、戦闘中、敵の攻撃、速さ、魔防が
                // 16一敵の奥義発動カウントの最大値x2だけ減少（最低8、敵が奥義を装備していない時も8）、
                let amount = MathUtil.ensureMin(16 - enemyUnit.maxSpecialCount * 2, 8);
                if (enemyUnit.special === Special.None) {
                    amount = 8;
                }
                enemyUnit.addSpursWithoutDef(-amount);
                // 自分が最初に受けた攻撃のダメージを30%軽減し、軽減した値を、自身の次の攻撃のダメージに＋（その戦闘中のみ。
                // 軽減値はスキルによる軽減効果も含む）、
                // 最初に受けた攻撃のダメージを軽減
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                // ダメージ軽減分を保存
                targetUnit.battleContext.addReducedDamageForNextAttackFuncs.push(
                    (defUnit, atkUnit, damage, currentDamage, activatesDefenderSpecial, context) => {
                        if (!context.isFirstAttack(atkUnit)) return;
                        defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                        defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                    }
                );
                // 攻撃ごとの固定ダメージに軽減した分を加算
                targetUnit.battleContext.calcFixedAddDamagePerAttackFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                        atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                        let addDamage = atkUnit.battleContext.reducedDamageForNextAttack;
                        atkUnit.battleContext.reducedDamageForNextAttack = 0;
                        return addDamage;
                    }
                    return 0;
                });
                // 戦闘後、7回復
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
}

// 祝福
{
    let setSkill = (skillId, buffFunc) => {
        applySpecialSkillEffectWhenHealingFuncMap.set(skillId,
            function (supporterUnit, targetUnit) {
                this.__applyBalmSkill(supporterUnit, buffFunc);
            }
        );
    };
    // 1種祝福
    setSkill(Special.KindledFireBalm, x => x.applyBuffs(4, 0, 0, 0));
    setSkill(Special.ShippuNoSyukuhuku, x => x.applyBuffs(0, 4, 0, 0));
    setSkill(Special.DaichiNoSyukuhuku, x => x.applyBuffs(0, 0, 4, 0));
    setSkill(Special.SeisuiNoSyukuhuku, x => x.applyBuffs(0, 0, 0, 4));

    // 2種祝福
    setSkill(Special.WindfireBalm, x => x.applyBuffs(4, 4, 0, 0));
    setSkill(Special.WindfireBalmPlus, x => x.applyBuffs(6, 6, 0, 0));

    // setSkill(Special.GokaDaichiNoSyukuhuku, x => x.applyBuffs(4, 0, 4, 0));
    setSkill(Special.GokaDaichiNoSyukuhukuPlus, x => x.applyBuffs(6, 0, 6, 0));

    // setSkill(Special.GokaSeisuiNoSyukuhuku, x => x.applyBuffs(4, 0, 0, 4));
    setSkill(Special.GokaSeisuiNoSyukuhukuPlus, x => x.applyBuffs(6, 0, 0, 6));

    setSkill(Special.EarthwindBalm, x => x.applyBuffs(0, 4, 4, 0));
    setSkill(Special.EarthwindBalmPlus, x => x.applyBuffs(0, 6, 6, 0));

    setSkill(Special.DelugeBalm, x => x.applyBuffs(0, 4, 0, 4));
    setSkill(Special.DelugeBalmPlus, x => x.applyBuffs(0, 6, 0, 6));

    setSkill(Special.DaichiSeisuiNoSyukuhuku, x => x.applyBuffs(0, 0, 4, 4));
    setSkill(Special.DaichiSeisuiNoSyukuhukuPlus, x => x.applyBuffs(0, 0, 6, 6));
}

// 響・キャンセル
{
    let skillId = PassiveX.GuardEcho;
    applySkillEffectForUnitFuncMap.set(skillId,
        // 戦闘開始時、自身のHPが25%以上なら、戦闘中、敵の奥義発動カウント変動量－1（同系統効果複数時、最大値適用）、
        // かつ敵から攻撃された時、最初に受けた攻撃と2回攻撃のダメージを20%軽減
        // （最初に受けた攻撃と2回攻撃：通常の攻撃は、1回目の攻撃のみ「2回攻撃」は、1～2回目の攻撃）
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.reducesCooldownCount = true;
                if (enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.2, enemyUnit);
                }
            }
        }
    );
}

// 海辺の日傘+
{
    let setSkill = skillId => {
        // ターン開始時スキル
        applySkillForBeginningOfTurnFuncMap.set(skillId,
            function (skillOwner) {
                for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                        for (let skillId of ally.enumerateSkills()) {
                            if (SaveSkills.has(skillId)) {
                                ally.reserveToAddStatusEffect(StatusEffectType.Guard);
                            }
                        }
                    }
                }
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAtkSpdSpurs(5);
                    let count = enemyUnit.getPositiveStatusEffects().length + enemyUnit.getNegativeStatusEffects().length;
                    let amount = Math.min(count * 4, 16);
                    enemyUnit.resSpur -= amount;
                }
            }
        );
    }
    setSkill(Weapon.SeasideParasolPlus);
    setSkill(Weapon.SunlightPlus);
}

// 信条
{
    let setSkill = (skillId, spurIndices) => {
        // ターン開始時スキル
        applySkillForBeginningOfTurnFuncMap.set(skillId,
            function (skillOwner) {
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToApplyBuffs(...spurIndices.map(n => n * 6));
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack)
                }
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                if (this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(...spurIndices.map(n => n * 3))
                }
            }
        );
    }
    // 攻撃速さの信条
    setSkill(PassiveC.AtkSpdPledge, [1, 1, 0, 0]);
    // 守備魔防の信条
    setSkill(PassiveC.DefResPledge, [0, 0, 1, 1]);
}

// 愛する人がいますか
{
    let skillId = PassiveB.BelieveInLove;
    // 速さの差を比較するスキルの比較判定時、自身の速さ＋7として判定
    evalSpdAddFuncMap.set(skillId, function (unit) {
        return 7;
    })
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 戦闘中、敵の攻撃、速さ、守備一5、
            enemyUnit.addSpdDefSpurs(-5);
            // 自身の攻撃、速さ、守備、魔防が自分が受けている攻撃、速さ、守備、魔防の弱化の値の2倍だけ上昇（能力値ごとに計算）
            // （例えば、攻撃ー7の弱化を受けていれば、 -7+14で、戦闘中、攻撃＋7となる）、
            targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    this.__applyDebuffReverse(targetUnit, targetUnit.passiveBInfo.name);
                }
            );
            // かつ速さが敵より高い時、受けた範囲奥義のダメージと、戦闘中に攻撃を受けた時のダメージを速さの差x5%軽減（最大50％）
            // （巨影の範囲奥義を除く）
            targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 5, 50);
            });
            // 敵が重装、騎馬の時、戦闘中、受けるダメージー〇（範囲奥義を含む）、敵が重装、騎馬でない時、戦闘中、最初に受けた攻撃と2回攻撃のダメージー〇の40%
            // （〇は、自分と周囲2マス以内にいる味方のうち強化の合計値が最も高い値）
            // （最初に受けた攻撃と2回攻撃：通常の攻撃は、1回目の攻撃のみ「2回攻撃」は、1～2回目の攻撃）
            targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                    let buffTotal = this.__getHighestTotalBuff(targetUnit, enemyUnit, units, true); // 自分を含む場合はtrueを指定
                    let amount = MathUtil.ensureMin(buffTotal, 0);
                    let moveType = enemyUnit.moveType;
                    let isArmorOrCavalry = moveType === MoveType.Armor || moveType === MoveType.Cavalry;
                    if (isArmorOrCavalry) {
                        targetUnit.battleContext.damageReductionValue += amount;
                    } else {
                        targetUnit.battleContext.damageReductionValueOfFirstAttacks += Math.trunc(amount * 0.4);
                    }
                }
            );
        }
    );
    // かつ速さが敵より高い時、受けた範囲奥義のダメージと、戦闘中に攻撃を受けた時のダメージを速さの差x5%軽減（最大50％）
    // （巨影の範囲奥義を除く）
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            // 速度回避
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, 5, 50);
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
        }
    );
}

// 反撃・強化増幅
{
    let setSkill = skillId => {
        // 敵から攻撃された時、距離に関係なく反撃する戦闘中、攻撃、速さ、守備、魔防が、自分と周囲2マス以内にいる味方のうち
        // 強化が最も高い値だけ上昇（能力値ごとに計算）
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                        let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units, true); // 自分を含む場合はtrueを指定
                        targetUnit.addSpurs(...amounts);
                    }
                );
            }
        );
    }
    // 遠反・強化増幅
    setSkill(PassiveA.DBonusDoubler);
    // 近反・強化増幅
    setSkill(PassiveA.CBonusDoubler);
}

// 純白ウイングスピア
{
    let skillId = Weapon.PureWingSpear;
    // 重装、騎馬特効
    // 奥義が発動しやすい（発動カウントー1）
    // ターン開始時、周囲2マス以内に味方がいる時、自分と周囲2マス以内の味方の攻撃、速さ＋6、「周囲2マス以内の味方の隣接マスに移動可能」を付与（1ターン）
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__isThereAllyIn2Spaces(skillOwner, 2)) {
                /** @type {Generator<Unit>} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true);
                for (let unit of units) {
                    unit.reserveToApplyBuffs(6, 6, 0, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            // 周囲3マス以内に味方がいる時、戦闘中、攻撃、速さ、守備、魔防が周囲3マス以内の味方の数✕3＋5だけ増加（最大14）、
            // 敵の奥義以外のスキルによる「ダメージを〇〇％軽減」を半分無効（無効にする数値は端数切捨て）（範囲奥義を除く）、
            // 攻撃を受けた時のダメージを30%軽減（範囲奥義を除く）、かつ
            // 戦闘中、自分の攻撃でダメージを与えた時、HPが回復回復値は、敵が重装、騎馬の時は14、そうでない時は7（与えたダメージが0でも効果は発動）
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
                let amount = MathUtil.ensureMax(count * 3 + 5, 14);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return 0.3;
                });
                let isArmorOrCavalry =
                    enemyUnit.moveType === MoveType.Armor ||
                    enemyUnit.moveType === MoveType.Cavalry;
                let n = isArmorOrCavalry ? 14 : 7;
                targetUnit.battleContext.healedHpByAttack += n;
            }
        }
    );
}

// おまじないの弓
{
    let skillId = Weapon.LuckyBow;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                        /** @type {Generator<Unit>} */
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2);
                        for (let unit of units) {
                            unit.reserveToResetDebuffs();
                            unit.reserveToClearNegativeStatusEffects();
                            unit.reserveHeal(10);
                        }
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.atkSpur += 7;
                    enemyUnit.atkSpur -= 7;
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            this.applyFixedValueSkill(targetUnit, enemyUnit, StatusIndex.Atk, 0.15);
                        }
                    );
                    targetUnit.battleContext.applyAttackSkillEffectAfterCombatFuncs.push(
                        (attackUnit, attackTargetUnit) => {
                            attackUnit.specialCount += 2;
                        }
                    )
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    }
                }
            }
        }
    );
}

// 幸せの誓約
{
    let skillId = Weapon.JoyfulVows;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    let applyFunc = index => {
                        let getStatusFunc = unit => unit.statusEvalUnit.getStatusesInPrecombat()[index];
                        let maxStatusUnits = this.__findMaxStatusUnits(skillOwner.enemyGroupId, getStatusFunc);
                        for (let maxStatusUnit of maxStatusUnits) {
                            let zeros = [0, 0, 0, 0];
                            zeros[index] = -7;
                            /** @type {Generator<Unit>} */
                            let units =
                                this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(maxStatusUnit, 2, true);
                            for (let unit of units) {
                                unit.reserveToApplyDebuffs(...zeros);
                            }
                            maxStatusUnit.reserveToAddStatusEffect(StatusEffectType.Sabotage);
                        }
                    }
                    for (let i = 0; i < 4; i++) {
                        applyFunc(i);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                    targetUnit.addAtkResSpurs(6);
                    if (targetUnit.battleContext.initiatesCombat) {
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    }
                }
            } else {
                // <錬成効果>
                if (targetUnit.hasPositiveStatusEffect(enemyUnit) ||
                    enemyUnit.hasNegativeStatusEffect()) {
                    targetUnit.addAtkResSpurs(6);
                    let debuffTotal = enemyUnit.debuffTotal;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                        debuffTotal = Math.min(debuffTotal, unit.getDebuffTotal(true));
                    }
                    this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.weaponInfo.name}により弱化の値${debuffTotal}を攻撃に追加`);
                    targetUnit.atkSpur += Math.abs(debuffTotal);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAtkResSpurs(5);
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                    }
                }
            }
        }
    );
}

// 光輝く翼・神
{
    let skillId = PassiveC.WingsOfLightPlus;
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.isMythicHero) {
                let count = this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.isMythicHero);
                if (count <= 3) {
                    let amount = MathUtil.ensureMax(this.currentTurn + 3, 8);
                    targetUnit.addAllSpur(amount);
                    targetUnit.battleContext.applySkillEffectFromAlliesFuncs.push(
                        (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) => {
                            targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                                return 0.3;
                            });
                        }
                    );
                }
            }
            if (targetUnit.isInCrossWithOffset(allyUnit, 1)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            /** @type {Generator<Unit>} */
            let units = this.enumerateUnitsInTheSameGroupOnMap(targetUnit);
            let found = false;
            for (let unit of units) {
                if (unit.isMythicHero) {
                    found = true;
                    break;
                }
                if (unit.isInCrossWithOffset(targetUnit, 1)) {
                    found = true;
                    break;
                }
            }
            if (found) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return 0.3;
                });
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
    );
}

// 双姫の陽翼・神
{
    let skillId = PassiveB.SunTwinWingPlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpursWithoutRes(-4);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
    );
}

// ニンジンの弓+
{
    let skillId = Weapon.CarrotBowPlus;
    let func = function (skillOwner) {
        /** @type {Generator<Unit>} */
        let units = this.enumerateUnitsInDifferentGroupOnMap(skillOwner);
        for (let unit of units) {
            if (unit.isInCrossWithOffset(skillOwner, 1)) {
                if (unit.statusEvalUnit.getEvalResInPrecombat() <=
                    skillOwner.statusEvalUnit.getEvalResInPrecombat() + 5) {
                    unit.reserveToApplyDebuffs(-7, 0, -7, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.Discord);
                }
            }
        }
    }
    applySkillForBeginningOfTurnFuncMap.set(skillId, func);
    applyEnemySkillForBeginningOfTurnFuncMap.set(skillId, func);
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAtkResSpurs(5);
                if (enemyUnit.hasStatusEffect(StatusEffectType.Discord)) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            }
        }
    );
}

// 十字牽制
{
    let setSkill = (skillId, spurFunc) => {
        updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
            function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
                if (targetUnit.isInCrossWithOffset(enemyAllyUnit, 1)) {
                    spurFunc(targetUnit);
                }
            }
        );
        applySkillEffectFromEnemyAlliesFuncMap.set(skillId,
            function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
                if (targetUnit.isInCrossWithOffset(enemyAllyUnit, 1)) {
                    enemyUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        );
    }
    // 速さ魔防の十字牽制
    setSkill(PassiveC.SpdResCrux, u => u.addSpdResSpurs(-4));
}

// 春風舞う天馬兎の卵
{
    let skillId = Weapon.SkyHopperEgg;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        // 無条件再移動
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 1;
    });
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                /** @type {Set<Unit>} */
                let pairs = new Set();
                /** @type {[Unit]} */
                let allUnits = Array.from(this.enumerateUnitsInTheSameGroupOnMap(skillOwner));
                for (let unit of allUnits) {
                    if (unit === skillOwner ||
                        unit.partnerHeroIndex === skillOwner.heroIndex) {
                        continue;
                    }
                    if (allUnits.some(u => u.isPartner(unit))) {
                        pairs.add(unit);
                    }
                }
                /** @type {[Unit]} */
                let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true));
                for (let unit of units.concat(Array.from(pairs))) {
                    unit.reserveToApplyBuffs(6, 6, 0, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.Charge);
                    unit.reserveToAddStatusEffect(StatusEffectType.ReducesDamageFromFirstAttackBy40Percent);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                /** @type {[Unit]} */
                let units = Array.from(this.enumerateUnitsInTheSameGroupOnMap(targetUnit));
                let count = units.filter(u => u.hasStatusEffect(StatusEffectType.Charge)).length;
                let amount = MathUtil.ensureMax(count * 4, 8);
                targetUnit.addAtkSpdSpurs(amount);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
    );
}

// しろいはるのゆめ
{
    let skillId = Support.SpringsDream;
    refreshSupportSkillSet.add(skillId);
    applyRefreshFuncMap.set(skillId,
        function (skillOwnerUnit, targetUnit) {
            /** @type {[Unit]} */
            let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true);
            for (let unit of units) {
                if (unit === skillOwnerUnit) continue;
                unit.applyAtkBuff(6);
                unit.addStatusEffect(StatusEffectType.BonusDoubler);
            }
            /** @type {[Unit]} */
            let nearestEnemies = this.__findNearestEnemies(targetUnit, 5);
            for (let enemy of nearestEnemies) {
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemy, 2, true);
                for (let unit of units) {
                    unit.applyAtkDebuff(-6);
                    unit.addStatusEffect(StatusEffectType.Panic);
                }
            }
        }
    );
}

// 春に揺蕩う白夢の卵
{
    let skillId = Weapon.DaydreamEgg;
    updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            if (targetUnit.isInCrossWithOffset(enemyAllyUnit, 1)) {
                if (targetUnit.hasNegativeStatusEffect()) {
                    targetUnit.addSpursWithoutSpd(-5);
                }
            }
        }
    );
    applySkillEffectFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            if (targetUnit.isInCrossWithOffset(enemyAllyUnit, 1)) {
                if (targetUnit.hasNegativeStatusEffect()) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                if (enemyUnit.hasNegativeStatusEffect()) {
                    targetUnit.addSpursWithoutSpd(5);
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        // ステータスの20%(奥義含む。含まない場合はisPrecombatで条件わけする)
                        if (isPrecombat) return;
                        let status = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                    });
                }
            }
        }
    );
}

// 春の出会いの槍
{
    let skillId = Weapon.FlingsterSpear;
    applySkillsAfterRallyForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit) {
            supporterUnit.addStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
            supporterUnit.heal(7);
        }
    );
    applySupportSkillForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit, supportTile) {
            if (!supporterUnit.isOneTimeActionActivatedForWeapon) {
                supporterUnit.isActionDone = false;
                supporterUnit.isOneTimeActionActivatedForWeapon = true;
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                if (targetUnit.hasStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack)) {
                    targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    );
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
    canRallyForciblyFuncMap.set(skillId,
        function (unit) {
            return true;
        }
    );
}

// 春に跳ぶ白兎の斧
{
    let skillId = Weapon.HippityHopAxe;
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.distance(allyUnit) <= 2) {
                targetUnit.addAllSpur(4);
            }
        }
    );
    applySkillEffectFromAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (targetUnit.distance(allyUnit) <= 2) {
                let percentage = allyUnit.isFullHp ? allyUnit.hp : Math.trunc(allyUnit.hp / 2);
                let ratio = MathUtil.ensureMax(percentage, 60) / 100.0;
                targetUnit.battleContext.damageReductionRatiosByChainGuard.push([allyUnit, ratio]);
            }
        }
    );
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__isThereAllyIn2Spaces(skillOwner)) {
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true);
                for (let unit of units) {
                    unit.reserveHeal(7);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            let count = 0;
            let foundDragon = false;
            /** @type {[Unit]} */
            let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
            for (let unit of units) {
                count++;
                foundDragon |= isWeaponTypeBreath(unit.weaponType);
            }
            if (count > 0) {
                let amount = MathUtil.ensureMax(count * 3 + 5, 14);
                if (foundDragon) {
                    amount = 14;
                }
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                let ratio = MathUtil.ensureMax(targetUnit.restHp / 100.0, 0.6);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(ratio, enemyUnit);
            }
        }
    );
}

// 獣乱のブレス
{
    let skillId = Weapon.BrutalBreath;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    let count = this.__countAlliesWithinSpecifiedSpaces(skillOwner, 2, () => true);
                    if (count <= 2) {
                        skillOwner.reserveToApplyBuffs(6, 6, 0, 0);
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.Dodge);
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let spur = MathUtil.ensureMin(5 - 2 * count, 0);
                targetUnit.addAllSpur(spur);

                if (count <= 1) {
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            } else {
                // <錬成効果>
                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, () => true);
                let spur = MathUtil.ensureMin(11 - 2 * count, 4);
                targetUnit.addAllSpur(spur);
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.healedHpAfterCombat += 7;
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) return;
                            this.addFixedDamageByStatus(atkUnit, defUnit, StatusIndex.Spd, 0.2);
                        });
                    }
                }
            }
        }
    );
}

// 打ち砕くもの
{
    let skillId = Weapon.Uchikudakumono;
    applySupportSkillForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit, supportTile) {
            if (supporterUnit.isWeaponRefined) {
                if (!supporterUnit.isOneTimeActionActivatedForWeapon) {
                    supporterUnit.isActionDone = false;
                    supporterUnit.isOneTimeActionActivatedForWeapon = true;
                }
            }
        }
    );
    applySkillsAfterRallyForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit) {
            let isRangedCavalry = targetUnit.moveType === MoveType.Cavalry && targetUnit.isRangedWeaponType();
            if (!isRangedCavalry) {
                targetUnit.addStatusEffect(StatusEffectType.MobilityIncreased);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                targetUnit.battleContext.refersMinOfDefOrRes = true;
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.addAllSpur(4);
                        let debuffTotals = targetUnit.getDebuffTotals(true);
                        let spurs = debuffTotals.map(s => -MathUtil.ensureMin(6 - Math.abs(s), 0));
                        spurs[0] = 0;
                        enemyUnit.addSpurs(...spurs);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        let debuffs = targetUnit.getDebuffTotals();
                        debuffs[0] = 0;
                        let isDebuffed = debuffs.some(s => s !== 0);
                        if (isDebuffed) {
                            targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                                if (isPrecombat) return;
                                let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                                atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                            });
                        }
                        targetUnit.battleContext.applySkillEffectAfterCombatForUnitFuncs.push(
                            (targetUnit, enemyUnit) => {
                                enemyUnit.applyDebuffs(0, -6, -6, -6);
                            }
                        );
                    }
                }
            }
        }
    );
    canRallyForciblyFuncMap.set(skillId,
        function (unit) {
            // 共謀がなくても使用できることは確認済み
            return true;
        }
    );
}

// サンダーダガー
{
    let skillId = Weapon.LevinDagger;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                /** @type {Generator<Unit>} */
                let nearestEnemies = this.__findNearestEnemies(skillOwner, 5);
                for (let nearestEnemy of nearestEnemies) {
                    /** @type {Generator<Unit>} */
                    let enemies = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(nearestEnemy, 2, true);
                    for (let enemy of enemies) {
                        enemy.reserveToApplyDebuffs(0, -7, 0, -7);
                        enemy.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                }
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    calcFixedAddDamageFuncMap.set(skillId,
        function (atkUnit, defUnit, isPrecombat) {
            if (!atkUnit.isWeaponRefined) {
                if (defUnit.hasNegativeStatusEffect()) {
                    let value = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.2);
                }
            } else {
                if (atkUnit.hasPositiveStatusEffect(defUnit) ||
                    defUnit.hasNegativeStatusEffect()) {
                    let value = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(value * 0.2);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.hasNegativeStatusEffect()) {
                    targetUnit.addAllSpur(5);
                }
            } else {
                // <錬成効果>
                if (targetUnit.hasPositiveStatusEffect(enemyUnit) ||
                    enemyUnit.hasNegativeStatusEffect()) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                let debuffs = this.__maxDebuffsFromAlliesWithinSpecificSpaces(enemyUnit, 2, true);
                                enemyUnit.addSpurs(...debuffs);
                            }
                        );
                    }
                }
            }
        }
    );
}

// 極光のブレス
{
    let skillId = Weapon.AuroraBreath;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.atkSpur += 6;
                    ++targetUnit.battleContext.followupAttackPriorityIncrement;
                } else {
                    targetUnit.defSpur += 6;
                    targetUnit.resSpur += 6;
                    --enemyUnit.battleContext.followupAttackPriorityDecrement;
                }
            } else {
                // <錬成効果>
                targetUnit.addSpursWithoutSpd(6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.reducesCooldownCount = true;
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addSpursWithoutSpd(4);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) return;
                            let status = DamageCalculatorWrapper.__getRes(defUnit, atkUnit, isPrecombat);
                            targetUnit.battleContext.additionalDamageOfFirstAttack += Math.trunc(status * 0.15);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                        });
                        targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                            // 魔防参照
                            return DamageCalculationUtility.getResDodgeDamageReductionRatio(atkUnit, defUnit);
                        });
                        targetUnit.battleContext.healedHpAfterCombat += 7;
                    }
                }
            }
        }
    );
    resetMaxSpecialCountFuncMap.set(skillId,
        function () {
            // 特殊錬成の場合奥義が発動しやすい
            return this.isWeaponSpecialRefined ? -1 : 0;
        }
    );
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (!defUnit.isWeaponSpecialRefined) {
                return;
            }
            let ratio = DamageCalculationUtility.getResDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
        }
    );
}

// スキンファクシ
{
    let skillId = Weapon.Skinfaxi;
    hasPathfinderEffectFuncMap.set(skillId,
        function () {
            return true;
        }
    );
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                /** @type {Generator<Unit>} */
                let units = this.enumerateUnitsInTheSameGroupOnMap(skillOwner);
                let partners = Array.from(units).filter(u => u.isPartner(skillOwner));
                if (partners.length === 1) {
                    partners[0].reserveToAddStatusEffect(StatusEffectType.Pathfinder);
                }
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.applyAtkUnity();
                    targetUnit.applySpdUnity();
                    targetUnit.applyDefUnity();
                    targetUnit.applyResUnity();
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.applyAtkUnity();
                    targetUnit.applySpdUnity();
                    targetUnit.applyDefUnity();
                    targetUnit.applyResUnity();
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        enemyUnit.addSpursWithoutRes(-4);
                        enemyUnit.battleContext.setBonusReversals(true, true, true, false);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) return;
                            let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.1);
                        });
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                    }
                }
            }
        }
    );
}

// 恐慌の聖光
{
    let skillId = Special.HolyPanic;
    noEffectOnSpecialCooldownChargeOnSupportSkillSet.add(skillId);

    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count2Specials.push(skillId);
    inheritableCount2Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let totalRes = enemyUnit.getResInCombat(targetUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.25));
        }
    );

    applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap.set(skillId,
        function (attackUnit, attackTargetUnit) {
            if (attackUnit.battleContext.isSpecialActivated) {
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true);
                for (let unit of units) {
                    unit.applyDebuffs(-6, -6, 0, 0);
                    unit.addStatusEffect(StatusEffectType.Panic);
                }
            }
        }
    );
}

// 抑制の聖光
{
    let skillId = Special.LightsRestraint;
    noEffectOnSpecialCooldownChargeOnSupportSkillSet.add(skillId);

    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count2Specials.push(skillId);
    inheritableCount2Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let totalRes = enemyUnit.getResInCombat(targetUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.25));
        }
    );

    applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap.set(skillId,
        function (attackUnit, attackTargetUnit) {
            if (attackUnit.battleContext.isSpecialActivated) {
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true);
                for (let unit of units) {
                    unit.increaseSpecialCount(1);
                    unit.addStatusEffect(StatusEffectType.Guard);
                }
            }
        }
    );
}

// 重圧の聖光
{
    let skillId = Special.HolyPressure;
    noEffectOnSpecialCooldownChargeOnSupportSkillSet.add(skillId);

    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);
    inheritableCount3Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let totalRes = enemyUnit.getResInCombat(targetUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.45));
        }
    );

    applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap.set(skillId,
        function (attackUnit, attackTargetUnit) {
            if (attackUnit.battleContext.isSpecialActivated) {
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true);
                for (let unit of units) {
                    unit.addStatusEffect(StatusEffectType.Gravity);
                }
            }
        }
    );
}

// 紋章の奇跡
{
    let skillId = PassiveA.EmblemsMiracle;
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (this.__isThereAllyInSpecifiedSpaces(defUnit, 3)) {
                defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.4);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(9);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
            }
            let allies = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
            if (allies.length >= 3 && enemyUnit.battleContext.initiatesCombat) {
                if (g_appData.globalBattleContext.miracleAndHealWithoutSpecialActivationCount[targetUnit.groupId] === 0) {
                    targetUnit.battleContext.canActivateNonSpecialMiracleAndHeal = true;
                }
            }
        }
    );
}

// 竜の咆哮
{
    let skillId = Special.DragonsRoar;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);
    inheritableCount3Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = targetUnit.getResInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.4));
        }
    );

    // 攻撃奥義のダメージ軽減
    applyDamageReductionRatiosWhenCondSatisfiedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            let canActivateSpecial =
                defUnit.tmpSpecialCount === 0 ||
                atkUnit.tmpSpecialCount === 0;
            let isSpecialActivated =
                defUnit.battleContext.isSpecialActivated ||
                atkUnit.battleContext.isSpecialActivated;
            if (canActivateSpecial || isSpecialActivated) {
                // 40%軽減
                if (defUnit.getEvalResInCombat(atkUnit) >= atkUnit.getEvalResInCombat(defUnit) - 4) {
                    defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.4);
                }
            }
        }
    );
}

// 神竜王の体術
{
    let skillId = Weapon.DivineOnesArts;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                let num = Unit.getOriginSet(units).size;
                let amount = MathUtil.ensureMax(num * 3 + 4, 10);
                enemyUnit.addAllSpur(-amount);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (isNormalAttackSpecial(enemyUnit.special)) {
                            let diff =
                                targetUnit.getEvalResInCombat(enemyUnit) -
                                enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 5) {
                                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack++;
                            }
                        }
                    }
                );
            }
        }
    );
}

// ティルフィング
{
    let skillId = Weapon.Thirufingu;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage <= 50) {
                    targetUnit.defSpur += 4;
                }
            } else {
                // <錬成効果>
                targetUnit.battleContext.canActivateNonSpecialMiracleFuncs.push((defUnit, atkUnit) => {
                    // 1戦闘1回まで
                    if (defUnit.battleContext.isNonSpecialMiracleActivated) {
                        return false;
                    }
                    return defUnit.battleContext.restHpPercentage >= 50;
                });
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (!this.__isSolo(targetUnit)) {
                        targetUnit.addAtkDefSpurs(5);
                    }
                }
            }
        }
    );
}

// 救済の騎士の槍
{
    let skillId = Weapon.PenitentLance;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3, true);
                for (let unit of units) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Hexblade);
                    unit.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                let positiveCount = targetUnit.getPositiveStatusEffects().length;
                let amount = MathUtil.ensureMax(positiveCount * 2 + 6, 12);
                enemyUnit.addAtkDefSpurs(-amount);
            }
        }
    );
    applySkillEffectRelatedToFollowupAttackPossibilityFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let positiveCount = targetUnit.getPositiveStatusEffects().length;
            if (positiveCount >= 3) {
                let ratio = enemyUnit.battleContext.canFollowupAttackIncludingPotent() ? 0.8 : 0.4;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(ratio, enemyUnit);
            }
        }
    );
}

// 響・飛走の先導
{
    let skillId = PassiveX.SoaringEcho;
    enumerateTeleportTilesForAllyFuncMap.set(skillId,
        function* (targetUnit, allyUnit) {
            // 周囲2マス以内の味方は自身の周囲2マス以内に移動可能
            if (targetUnit.distance(allyUnit) <= 2 &&
                targetUnit.moveType === MoveType.Infantry ||
                targetUnit.moveType === MoveType.Flying) {
                yield* this.__enumeratePlacableTilesWithinSpecifiedSpaces(allyUnit.placedTile, targetUnit, 2);
            }
        }
    );
}

// 執着
{
    let skillId = PassiveA.Obsession;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(9);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialForFollowupAttack = true;
            }
        }
    );
    applyPotentSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                this.__applyPotent(targetUnit, enemyUnit);
            }
        }
    );
}

// 吹き渡る雪書
{
    let skillId = Weapon.IceboundTome;
    enumerateTeleportTilesForUnitFuncMap.set(skillId,
        function (unit) {
            let func = u => u.isPartner(unit);
            return this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 3, 2, func);
        }
    );
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            /** @type {[Unit]} */
            let units = this.enumerateUnitsInTheSameGroupOnMap(skillOwner);
            for (let unit of units) {
                if (unit.isPartner(skillOwner)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                isRangedWeaponType(enemyUnit.weaponType)) {
                let atk = enemyUnit.getAtkInPrecombat();
                let amount = MathUtil.ensureMinMax(Math.trunc(atk * 0.25 - 4), 5, 14);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    let distance = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                    return 0.2 + MathUtil.ensureMax(distance, 5) * 0.1;
                });
                targetUnit.battleContext.healedHpByFollowupAttack += 7;
            }
        }
    );
}

// 煌めく理力
{
    let skillId = PassiveC.GlitteringAnima;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3, true);
                for (let unit of units) {
                    unit.reserveToApplyBuffs(6, 6, 0, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.Canto1);
                    unit.reserveToAddStatusEffect(StatusEffectType.NeutralizesPenalties);
                }

                /** @type {[Unit]} */
                let nearestEnemies = this.__findNearestEnemies(skillOwner);
                for (let unit of nearestEnemies) {
                    let enemies = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 3, true);
                    for (let enemy of enemies) {
                        enemy.reserveToApplyDebuffs(0, 0, -6, -6);
                        enemy.reserveToAddStatusEffect(StatusEffectType.Panic);
                        enemy.reserveToAddStatusEffect(StatusEffectType.Discord);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
    );
}

// 輝映の聖光
{
    let skillId = Special.GlitterOfLight;
    noEffectOnSpecialCooldownChargeOnSupportSkillSet.add(skillId);

    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);
    inheritableCount3Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let totalRes = enemyUnit.getResInCombat(targetUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(totalRes * 0.45));
        }
    );

    applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap.set(skillId,
        function (attackUnit, attackTargetUnit) {
            if (attackUnit.battleContext.isSpecialActivated) {
                /** @type {[Unit]} */
                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true);
                for (let unit of units) {
                    unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }
            }
        }
    );
}

// 魔器・愛らしい雪杖
{
    let skillId = Weapon.ArcaneCharmer;
    applySkillEffectFromAlliesExcludedFromFeudFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (targetUnit.distance(allyUnit) <= 3) {
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.additionalDamage += 7;
            }
        }
    );
}

// 強化反転の剣+
{
    let skillId = Weapon.ReversalBlade;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                enemyUnit.battleContext.setAllBonusReversal();
            }
        }
    );
}

// 飛竜裂空
{
    let skillId = PassiveB.WyvernRift;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            enemyUnit.addAtkDefSpurs(-4);

            targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    let getStatus = (tu, eu) => tu.getEvalSpdInCombat(eu) + tu.getEvalDefInCombat(eu);
                    if (getStatus(targetUnit, enemyUnit) >=
                        getStatus(enemyUnit, targetUnit) - 10) {
                        let n = MathUtil.ensureMinMax(targetUnit.getDefInPrecombat() - 35, 0, 7);
                        targetUnit.battleContext.additionalDamage += n;
                        targetUnit.battleContext.damageReductionValueOfFirstAttacks += n;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                        enemyUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += 20;
                    }
                }
            );
        }
    );
}

// 可憐の斧
{
    let skillId = Weapon.AxeOfAdoration;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let amount = MathUtil.ensureMin(16 - enemyUnit.maxSpecialCount * 2, 8);
                if (enemyUnit.special === Special.None) {
                    amount = 8;
                }
                targetUnit.addSpursWithoutRes(amount);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                let ratio = enemyUnit.getEvalDefInPrecombat() >= enemyUnit.getEvalResInPrecombat() ? 0.7 : 0.3;
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(ratio);
            }
        }
    );
}

// フェザーソード
{
    let skillId = Weapon.FeatherSword;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat) {
                    if (targetUnit.battleContext.restHpPercentage <= 75 ||
                        enemyUnit.weaponType === WeaponType.Sword ||
                        enemyUnit.weaponType === WeaponType.Lance ||
                        enemyUnit.weaponType === WeaponType.Axe ||
                        enemyUnit.weaponType === WeaponType.ColorlessBow ||
                        enemyUnit.moveType === MoveType.Armor) {
                        targetUnit.battleContext.isVantageActivatable = true;
                    }
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (enemyUnit.battleContext.initiatesCombat) {
                    if (targetUnit.battleContext.restHpPercentage <= 90 ||
                        enemyUnit.weaponType === WeaponType.Sword ||
                        enemyUnit.weaponType === WeaponType.Lance ||
                        enemyUnit.weaponType === WeaponType.Axe ||
                        enemyUnit.weaponType === WeaponType.ColorlessBow ||
                        enemyUnit.moveType === MoveType.Armor) {
                        targetUnit.battleContext.isVantageActivatable = true;
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
                        let amount = MathUtil.ensureMinMax(count * 3, 0, 6);
                        targetUnit.addAtkSpdSpurs(amount);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                    }
                }
            }
        }
    );
    canActivateCantoFuncMap.set(skillId, function (unit) {
        return unit.isWeaponSpecialRefined;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return this.isWeaponSpecialRefined ? 2 : 0;
    });
}

// リンカの鬼金棒
{
    let skillId = Weapon.RinkahNoOnikanabo;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage < 100 ||
                    enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.addAtkDefSpurs(5);
                    targetUnit.battleContext.increaseCooldownCountForDefense = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage < 100 ||
                    enemyUnit.battleContext.restHpPercentage >= 75 ||
                    enemyUnit.battleContext.initiatesCombat) {
                    targetUnit.addSpurs(5, 4, 5, 4);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                    targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            let status = targetUnit.getDefInCombat(enemyUnit);
                            targetUnit.battleContext.damageReductionValueOfFirstAttacks += Math.trunc(status * 0.15);
                        }
                    );
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.healedHpByAttack += 7;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                    }
                    // ダメージ軽減分を保存
                    targetUnit.battleContext.addReducedDamageForNextAttackFuncs.push(
                        (defUnit, atkUnit, damage, currentDamage, activatesDefenderSpecial, context) => {
                            if (!context.isFirstAttack(atkUnit)) return;
                            defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                            defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                        }
                    );
                    // 攻撃ごとの固定ダメージに軽減した分を加算
                    targetUnit.battleContext.calcFixedAddDamagePerAttackFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                            atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                            let addDamage = atkUnit.battleContext.reducedDamageForNextAttack;
                            atkUnit.battleContext.reducedDamageForNextAttack = 0;
                            return addDamage;
                        }
                        return 0;
                    });
                }
            }
        }
    );
}

// 穢れなき白槍
{
    let skillId = Weapon.AirborneSpear;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return DamageCalculationUtility.getResDodgeDamageReductionRatio(atkUnit, defUnit);
                });
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                            enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    );
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            let tSum = targetUnit.getSpdInCombat(enemyUnit) + targetUnit.getResInCombat(enemyUnit);
                            let eSum = enemyUnit.getSpdInCombat(targetUnit) + enemyUnit.getResInCombat(targetUnit);
                            if (tSum >= eSum - 5) {
                                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 2;
                            }
                        }
                    );
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
    );

    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (defUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(defUnit)) {
                let ratio = DamageCalculationUtility.getResDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
            }
        }
    );
}

// グルグラント
{
    let skillId = Weapon.Gurgurant;
    updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                if (enemyAllyUnit.distance(targetUnit) <= 2) {
                    targetUnit.addAtkDefSpurs(-5);
                }
            } else {
                if (enemyAllyUnit.distance(targetUnit) <= 4) {
                    targetUnit.addAtkDefSpurs(-5);
                }
            }
        }
    );

    applySkillEffectFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (allyUnit.isWeaponRefined) {
                if (allyUnit.distance(targetUnit) <= 4) {
                    enemyUnit.battleContext.invalidateBuffs(true, false, true, false);
                    targetUnit.battleContext.followupAttackPriorityDecrement--;
                    enemyUnit.battleContext.reducesCooldownCount = true;
                }
            }
        }
    );

    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addAtkDefSpurs(-5);
                        let status = targetUnit.getDefInPrecombat();
                        let amount = Math.trunc(status * 0.15);
                        enemyUnit.addAtkDefSpurs(-amount);
                        targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                            return 0.3;
                        });
                    }
                }
            }
        }
    );
}

// こわいゆめ・神
{
    let skillId = Support.FrightfulDreamPlus;
    refreshSupportSkillSet.add(skillId);
    applyRefreshFuncMap.set(skillId,
        function (skillOwnerUnit, targetUnit) {
            /** @type {[Unit]} */
            let units = this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit);
            for (let unit of units) {
                if (skillOwnerUnit.isInCrossOf(unit) ||
                    targetUnit.isInCrossOf(unit)) {
                    unit.applyAllDebuff(-5);
                    unit.addStatusEffects([StatusEffectType.Guard, StatusEffectType.Discord]);
                }
            }
        }
    );
}

// 不幸の花
{
    let skillId = Weapon.FlowerOfSorrow;

    updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            if (targetUnit.isInCrossOf(enemyAllyUnit)) {
                let amount = targetUnit.isWeaponRefined ? 5 : 4;
                targetUnit.addDefResSpurs(-amount);
            }
        }
    );

    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.restHpPercentage >= 75 ||
                    this.__isThereAllyIn2Spaces(enemyUnit)) {
                    enemyUnit.addSpursWithoutDef(-4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        enemyUnit.addSpursWithoutDef(-4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        targetUnit.battleContext.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs.push(
                            (attackUnit, attackTargetUnit) => {
                                /** @type {[Unit]} */
                                let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true);
                                for (let unit of units) {
                                    unit.takeDamage(10);
                                }
                            }
                        );
                    }
                }
            }
        }
    );
}

// リュングヘイズ
{
    let skillId = Weapon.Lyngheior;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        return g_appData.currentTurn <= 4;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 3;
    });
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.addAtkSpdSpurs(6);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addSpurs(6, 6, 4, 4);
                    targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                    targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) return;
                            let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                        });
                    }
                }
            }
        }
    );
}

// 魔弾・神
{
    let skillId = Special.SeidrShellPlus;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);
    inheritableCount3Specials.push(skillId);

    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let currentTurn = this.globalBattleContext.currentTurn;
            if (currentTurn === 1 || currentTurn === 4) {
                skillOwner.reserveToReduceSpecialCount(3);
            }
        }
    );

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            targetUnit.battleContext.addSpecialAddDamage(20);
        }
    );

    selectReferencingResOrDefFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            if (this.isLogEnabled) {
                let skillName = DebugUtil.getSkillName(atkUnit, atkUnit.specialInfo);
                this.writeDebugLog(`${skillName}により守備魔防の低い方でダメージ計算`);
            }

            let defInCombat = defUnit.getDefInCombat(atkUnit);
            let resInCombat = defUnit.getResInCombat(atkUnit);
            atkUnit.battleContext.refersResForSpecial = resInCombat < defInCombat;
            if (defInCombat === resInCombat) {
                atkUnit.battleContext.refersResForSpecial = !atkUnit.isPhysicalAttacker();
            } else {
                atkUnit.battleContext.refersResForSpecial = resInCombat < defInCombat;
            }
        }
    );
}

// 被害妄想の弓
{
    let skillId = Weapon.HigaimosoNoYumi;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    let found = false;
                    /** @type {[Unit]} */
                    let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2);
                    for (let unit of units) {
                        found = true;
                        unit.reserveTakeDamage(1);
                    }
                    if (found) {
                        skillOwner.reserveTakeDamage(1);
                        skillOwner.reserveToReduceSpecialCount(1);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.hasNegativeStatusEffect() ||
                    !targetUnit.battleContext.isRestHpFull) {
                    targetUnit.addAtkSpdSpurs(5);
                    targetUnit.battleContext.isDesperationActivatable = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.hasNegativeStatusEffect() ||
                    !targetUnit.battleContext.isRestHpFull) {
                    targetUnit.addAtkSpdSpurs(5);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.isDesperationActivatable = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        let reducedHp = targetUnit.maxHpWithSkills - targetUnit.restHp;
                        let amount = MathUtil.ensureMin(reducedHp * 2 + 5, 15);
                        targetUnit.addAtkSpdSpurs(amount);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                }
            }
        }
    );
}

// 愛の祭
{
    let setSkill = (skillId, getPreCombatStatus, addSpurs, getEvalStatus, ratio) => {
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    let amount = Math.trunc(getPreCombatStatus(targetUnit) * 0.15);
                    addSpurs(targetUnit, 5 + amount);
                }
            }
        );
        // 戦闘開始後ダメージ
        // 攻撃可能かを判定するためにこのタイミングになる
        applySkillEffectRelatedToFollowupAttackPossibilityFuncMap.set(skillId,
            function (targetUnit, enemyUnit) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    let advantageous =
                        DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit);
                    let isAdvantageous = advantageous === TriangleAdvantage.Advantageous;
                    let cond = getEvalStatus(targetUnit, enemyUnit) > getEvalStatus(enemyUnit, targetUnit);
                    let enemyAtk = enemyUnit.getAtkInCombat(targetUnit);
                    let damageRatio = isAdvantageous || cond ? ratio * 2 : ratio;
                    if (targetUnit.battleContext.initiatesCombat ||
                        targetUnit.battleContext.canCounterattack) {
                        let damage = Math.trunc(enemyAtk * damageRatio);
                        let skillName = DebugUtil.getSkillName(targetUnit, targetUnit.weaponInfo);
                        let detail = `damage(${damage}) = enemy_atk(${enemyAtk}) * ratio(${damageRatio})`;
                        this.writeDebugLog(`${skillName}により戦闘開始後ダメージ+${damage}。${detail}`);
                        enemyUnit.battleContext.damageAfterBeginningOfCombat += damage;
                    }
                }
            }
        );
    }

    // 愛の祭の花籠+
    setSkill(
        Weapon.DevotedBasketPlus,
        u => u.getSpdInPrecombat(),
        (u, i) => u.addAtkSpdSpurs(i),
        (tu, eu) => tu.getEvalSpdInCombat(eu),
        0.15
    );
    // 愛の祭の斧+
    setSkill(
        Weapon.DevotedAxePlus,
        u => u.getDefInPrecombat(),
        (u, i) => u.addAtkDefSpurs(i),
        (tu, eu) => tu.getEvalDefInCombat(eu),
        0.15
    );
}

// 鈍色の迷夢
{
    let skillId = PassiveA.GrayIllusion;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addSpursWithoutSpd(9);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getEvalResInCombat(enemyUnit) >
                            enemyUnit.getEvalResInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesCounterattack = true;
                        }
                    }
                );
            }
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.initiatesCombat) {
                let maxSpd = Number.MIN_SAFE_INTEGER;
                let units = [];
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 3)) {
                    this.writeDebugLogLine(`${maxSpd}, ${units.map(u => u.nameWithGroup)}`);
                    let spd = unit.getSpdInPrecombat();
                    if (spd > maxSpd) {
                        maxSpd = spd;
                        units = [unit];
                    } else if (spd === maxSpd) {
                        units.push(unit);
                    }
                }
                for (let unit of units) {
                    if (g_appData.gameMode !== GameMode.SummonerDuels) {
                        unit.addStatusEffect(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately);
                    } else {
                        if (unit.isActionDone) {
                            unit.addStatusEffect(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately);
                        } else {
                            unit.endAction();
                        }
                    }
                }
            }
        }
    );
}

// 儚く優しい心の器
{
    let skillId = Weapon.TenderVessel;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        // 無条件再移動
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 1;
    });
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpursWithoutSpd(5);
                let amount = Math.trunc(targetUnit.getResInPrecombat() * 0.2);
                targetUnit.addSpursWithoutSpd(amount);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
    );
    // 戦闘開始後ダメージ
    // 攻撃可能かを判定するためにこのタイミングになる
    applySkillEffectRelatedToFollowupAttackPossibilityFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let advantageous = DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit);
                let isAdvantageous = advantageous === TriangleAdvantage.Advantageous;
                let statusCond = targetUnit.getEvalResInCombat(enemyUnit) > enemyUnit.getEvalResInCombat(targetUnit);
                let enemyAtk = enemyUnit.getAtkInCombat(targetUnit);
                let ratio = isAdvantageous || statusCond ? 0.4 : 0.2;
                if (targetUnit.battleContext.initiatesCombat ||
                    targetUnit.battleContext.canCounterattack) {
                    let damage = Math.trunc(enemyAtk * ratio);
                    this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.weaponInfo.name}により戦闘開始後ダメージ+${damage}。enemy atk: ${enemyAtk}, ratio: ${ratio}`);
                    enemyUnit.battleContext.damageAfterBeginningOfCombat += damage;
                }
            }
        }
    );
}

// 華日の腕輪・護
{
    let skillId = PassiveB.SunlitBundleD;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                if (targetUnit.battleContext.initiatesCombat) {
                    enemyUnit.battleContext.isVantageActivatable = true;
                }
                enemyUnit.addAtkDefSpurs(-5);
                targetUnit.battleContext.setAttackCountFuncs.push(
                    (targetUnit, enemyUnit) => {
                        targetUnit.battleContext.attackCount = 2;
                        targetUnit.battleContext.counterattackCount = 2;
                    }
                );
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                targetUnit.battleContext.healedHpByAttack += 7;
            }
        }
    );
}

// 生命の業火
{
    let setSkill = (skillId, spurFunc) => {
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                this._applySkillEffectForUnitFuncDict[PassiveA.FirefloodBoost3] = (targetUnit, enemyUnit, calcPotentialDamage) => {
                    if (targetUnit.battleContext.restHpPercentage >= 50) {
                        spurFunc(targetUnit);
                        let func = unit => unit.battleContext.restHpPercentage >= 50;
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, func)) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                }
            }
        );
    }
    // 生命の業火疾風3
    setSkill(PassiveA.FirestormBoost3, u => u.addAtkSpdSpurs(7));
    // 生命の業火静水3
    setSkill(PassiveA.FirefloodBoost3, u => u.addAtkResSpurs(7));
    // 生命の業火大地3
    setSkill(PassiveA.EarthfireBoost3, u => u.addAtkDefSpurs(7));
    // 生命の疾風大地3
    setSkill(PassiveA.EarthwindBoost3, u => u.addSpdDefSpurs(7));
}

// 強く気高き魂の槍
{
    let skillId = Weapon.RighteousLance;
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, enemyUnit, calcPotentialDamage) {
            // 周囲2マス以内
            if (targetUnit.distance(allyUnit) <= 3) {
                targetUnit.addAtkDefSpurs(4);
            }
        }
    );
    applySkillEffectFromAlliesExcludedFromFeudFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            targetUnit.battleContext.healedHpAfterCombat += 7;
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
                let amount = MathUtil.ensureMinMax(count * 4 + 6, 0, 14);
                this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.weaponInfo.name}により${amount}ステータスが変化。count: ${count}`);
                enemyUnit.addAtkDefSpurs(-amount);
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return 0.3;
                });
                targetUnit.battleContext.healedHpAfterCombat += 7;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
            }
        }
    );
}

// 闇の樹海の竜神
{
    let skillId = PassiveC.DarklingDragon;
    // 護り手
    SaveSkills.add(skillId);
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let foundAllies = false;
            let foundPartners = false;
            // noinspection LoopStatementThatDoesntLoopJS
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                foundAllies = true;
                break;
            }
            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                if (skillOwner.isPartner(unit)) {
                    foundPartners = true;
                    break;
                }
            }
            if (foundAllies) {
                skillOwner.reserveToApplyBuffs(0, 0, 6, 6);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.WarpBubble);
            }
            if (foundPartners) {
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    if (skillOwner.isPartner(unit)) {
                        unit.reserveToApplyBuffs(0, 0, 6, 6);
                        unit.reserveToAddStatusEffect(StatusEffectType.WarpBubble);
                        this.writeDebugLog(`${unit.nameWithGroup}は${skillOwner.nameWithGroup}の${skillOwner.passiveCInfo.name}の効果対象`);
                    }
                }
            } else {
                let maxDef = Number.MIN_SAFE_INTEGER;
                let units = [];
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    let def = unit.getDefInPrecombat();
                    if (def > maxDef) {
                        maxDef = def;
                        units = [unit];
                    } else if (def === maxDef) {
                        units.push(unit);
                    }
                }
                for (let unit of units) {
                    unit.reserveToApplyBuffs(0, 0, 6, 6);
                    unit.reserveToAddStatusEffect(StatusEffectType.WarpBubble);
                    this.writeDebugLog(`${unit.nameWithGroup}は${skillOwner.nameWithGroup}の${skillOwner.passiveCInfo.name}の効果対象`);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                if (targetUnit.battleContext.isSaviorActivated) {
                    targetUnit.addSpursWithoutSpd(4);
                }
            }
        }
    );
    canActivateSaveSkillFuncMap.set(skillId,
        function (atkUnit, unit) {
            return atkUnit.isRangedWeaponType();
        }
    );
}

// 無垢なる愛のブレス
{
    let skillId = Weapon.LovingBreath;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3);
                let amount = MathUtil.ensureMinMax(count * 4 + 6, 0, 14);
                this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.weaponInfo.name}により${amount}攻撃が変化。count: ${count}`);
                targetUnit.atkSpur += amount;
                enemyUnit.atkSpur -= amount;
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.healedHpAfterCombat += 7;

                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return DamageCalculationUtility.getResDodgeDamageReductionRatio(atkUnit, defUnit);
                });
            }
        }
    );

    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            let ratio = DamageCalculationUtility.getResDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
        }
    );
}

// 紋章士マルス
{
    let skillId = getEmblemHeroSkillId(EmblemHero.Marth);
    resetMaxSpecialCountFuncMap.set(skillId,
        function () {
            return -1;
        }
    );
    applySkillEffectAfterSetAttackCountFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.isTwiceAttackActivating()) {
                enemyUnit.battleContext.damageReductionValueOfSpecialAttack += 8;
            }
        }
    );
}

// スターラッシュ
{
    let skillId = Special.LodestarRush;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count2Specials.push(skillId);
    inheritableCount2Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = targetUnit.getSpdInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.4));
        }
    );

    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
            );
        }
    );

    applySkillEffectsPerAttackFuncMap.set(skillId,
        function (targetUnit, enemyUnit, canActivateAttackerSpecial) {
            if (targetUnit.tmpSpecialCount === 0 ||
                targetUnit.battleContext.isSpecialActivated) {
                targetUnit.battleContext.potentOverwriteRatio = 1.0;
            }
        }
    );

    // 攻撃奥義のダメージ軽減
    applyDamageReductionRatiosWhenCondSatisfiedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            if (defUnit.tmpSpecialCount === 0 ||
                atkUnit.tmpSpecialCount === 0 ||
                defUnit.battleContext.isSpecialActivated ||
                atkUnit.battleContext.isSpecialActivated) {
                defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.4);
            }
        }
    );
}

// 神速4
{
    let skillId = PassiveB.Potent4;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            enemyUnit.addSpdDefSpurs(-4);
            targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                return 0.3;
            });
        }
    );
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
        }
    );
    applyPotentSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            this.__applyPotent(targetUnit, enemyUnit);
        }
    );
}

// 英雄王の剣
{
    let skillId = Weapon.HeroKingSword;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.2);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                targetUnit.battleContext.isDesperationActivatable = true;
            }
        }
    );
}

// リトスの神竜王
{
    let skillId = PassiveC.DragonMonarch;
    applyEndActionSkillsFuncMap.set(skillId,
        function () {
            for (let tile of g_appData.map.enumerateTilesInSquare(this.placedTile, 5)) {
                tile.reserveDivineVein(DivineVeinType.Stone, this.groupId);
            }
        }
    );

    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, enemyUnit, calcPotentialDamage) {
            if (Math.abs(allyUnit.posX - targetUnit.posX) <= 2 &&
                Math.abs(allyUnit.posY - targetUnit.posY) <= 2) {
                targetUnit.addAllSpur(4);
            }
        }
    );

    applySkillEffectFromAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (Math.abs(allyUnit.posX - targetUnit.posX) <= 2 &&
                Math.abs(allyUnit.posY - targetUnit.posY) <= 2) {
                enemyUnit.battleContext.reducesCooldownCount = false;
            }
        }
    );

    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isThereAllyInSquare(targetUnit, 5)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return 0.3;
                });
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
    );
}

// 白き神竜王のブレス
{
    let skillId = Weapon.MonarchsStone;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let atk = enemyUnit.getAtkInPrecombat();
                let amount = MathUtil.ensureMinMax(Math.trunc(atk * 0.25) - 4, 5, 14);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
    );
}

// ナバタの槍+
{
    let skillId = Weapon.NabataLancePlus;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__isThereAllyIn2Spaces(skillOwner, 2)) {
                skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.Hexblade);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.1);
                });
            }
        }
    );
}

// 鍛錬の鼓動
{
    let setSkill = (skillId, func) => {
        // ターン開始時スキル
        applySkillForBeginningOfTurnFuncMap.set(skillId,
            function (skillOwner) {
                let turn = this.globalBattleContext.currentTurn;
                let amount = Math.min(turn * 2, 6);
                func(skillOwner, amount);
                skillOwner.reserveToReduceSpecialCount(1);
            }
        );
    };
    // 鍛錬の鼓動・刃
    setSkill(PassiveC.PulseUpBlades, (u, a) => u.reserveToApplyBuffs(a, a, 0, 0));
}

// 悠久の黄砂の絆弓
{
    let skillId = Weapon.SandglassBow;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.globalBattleContext.currentTurn === 1) {
                skillOwner.reserveToReduceSpecialCount(2);
            }
            let found = false;
            /** @type {Unit[]} */
            let allies = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2);
            for (let unit of allies) {
                found = true;
                let moveType = unit.moveType;
                if (moveType === MoveType.Infantry ||
                    moveType === MoveType.Armor) {
                    unit.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                    unit.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
            }
            if (found) {
                skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkSpdSpurs(6);
            }
        }
    );
    // 固定ダメージ
    calcFixedAddDamageFuncMap.set(skillId,
        function (atkUnit, defUnit, isPrecombat) {
            let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
            let additionalDamage = Math.trunc(status * 0.15);
            this.writeDebugLog(`${atkUnit.weaponInfo.name}により固定ダメージ+${additionalDamage}(atk(${status}) * 0.15)`);
            atkUnit.battleContext.additionalDamage += additionalDamage;
            // 奥義発動時
            let ratio = 0.1 + 0.1 * atkUnit.maxSpecialCount;
            let spd = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
            let additionalDamageOfSpecial = Math.trunc(spd * ratio);
            this.writeDebugLog(`${atkUnit.weaponInfo.name}により奥義発動時の固定ダメージ+${additionalDamageOfSpecial}(spd(${spd}) * ratio(${ratio}))`);
            atkUnit.battleContext.additionalDamageOfSpecial += additionalDamageOfSpecial;
        }
    );
}

// ナバタの燭台+
{
    let skillId = Weapon.NabataBeaconPlus;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__isThereAllyIn2Spaces(skillOwner)) {
                skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.Desperation);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.1);
                });
            }
        }
    );
}

// 信義4
{
    let setSkill = (skillId, func, spurFunc) => {
        // ターン開始時スキル
        applySkillForBeginningOfTurnFuncMap.set(skillId,
            function (skillOwner) {
                func(skillOwner);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                if (this.__isThereAllyIn2Spaces(targetUnit, 2)) {
                    spurFunc(targetUnit);
                }
            }
        );
    };

    // 攻撃守備の信義4
    setSkill(PassiveC.AtkDefOath4,
        u => u.reserveToApplyBuffs(6, 0, 6, 0),
        u => u.addAtkDefSpurs(3)
    );
}

// 砂漠の天馬騎士の剣
{
    let skillId = Weapon.BladeOfSands;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            /** @type {Unit[]} */
            let allies = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2);
            for (let unit of allies) {
                found = true;
                unit.reserveToApplyBuffs(0, 6, 0, 6);
                unit.reserveToAddStatusEffect(StatusEffectType.BonusDoubler);
                unit.reserveToAddStatusEffect(StatusEffectType.NullPanic);
            }
            if (found) {
                skillOwner.reserveToApplyBuffs(0, 6, 0, 6);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.BonusDoubler);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit, 2)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
            }
        }
    );
}

// 防壁
{
    let generateFunc = (func, isBulwalk4 = false) => function (targetUnit, enemyUnit, calcPotentialDamage) {
        func(enemyUnit);
        if (isBulwalk4) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
        }
        targetUnit.battleContext.healedHpAfterCombat += 7;
    };
    let setSkill = (skillId, func, isBulwalk4) => {
        canActivateObstructToAdjacentTilesFuncMap.set(skillId,
            function (unit, moveUnit) {
                return true;
            }
        );
        canActivateObstructToTilesIn2SpacesFuncMap.set(skillId,
            function (unit, moveUnit) {
                return true;
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId, generateFunc(func, isBulwalk4));
    };

    // 攻撃守備の防壁4
    setSkill(PassiveB.AtkDefBulwark4, u => u.addAtkDefSpurs(-4), true);
    // 速さ魔防の防壁4
    setSkill(PassiveB.SRBulwark4, u => u.addSpdResSpurs(-4), true);
}

// 三雄の双刃
{
    let skillId = Special.ArmsOfTheThree;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count2Specials.push(skillId);
    inheritableCount2Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = targetUnit.getResInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.4));
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        }
    );

    // ダメージ軽減
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    if (targetUnit.isSpecialCharged) {
                        let targetRes = targetUnit.getEvalResInCombat(enemyUnit);
                        let enemyRes = enemyUnit.getEvalResInCombat(targetUnit);
                        let diff = targetRes - enemyRes;
                        this.writeDebugLog(`奥義${targetUnit.specialInfo.name}による魔防参照。${targetUnit.nameWithGroup}: ${targetRes}, ${enemyUnit.nameWithGroup}: ${enemyRes}`);
                        if (diff > 0) {
                            let ratio = Math.min(0.03 * diff, 0.3);
                            this.writeDebugLog(`奥義${targetUnit.specialInfo.name}によりダメージを${ratio}軽減(diff: ${diff})`);
                            targetUnit.battleContext.damageReductionRatiosByNonDefenderSpecial.push(ratio);
                        } else {
                            this.writeDebugLog(`奥義${targetUnit.specialInfo.name}は魔防条件を満たさない(diff: ${diff})`);
                        }
                    }
                }
            );
        }
    );
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (defUnit.isSpecialCharged) {
                let targetRes = defUnit.getEvalResInPrecombat();
                let enemyRes = atkUnit.getEvalResInPrecombat();
                let diff = targetRes - enemyRes;
                this.writeDebugLog(`奥義${defUnit.specialInfo.name}による戦闘開始時魔防参照。${defUnit.nameWithGroup}: ${targetRes}, ${atkUnit.nameWithGroup}: ${enemyRes}`);
                if (diff > 0) {
                    let ratio = Math.min(0.03 * diff, 0.3);
                    this.writeDebugLog(`奥義${defUnit.specialInfo.name}により範囲奥義のダメージを${ratio}軽減(diff: ${diff})`);
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                } else {
                    this.writeDebugLog(`奥義${defUnit.specialInfo.name}は戦闘開始時の魔防条件を満たさない(diff: ${diff})`);
                }
            }
        }
    );
}

// 永遠の理想郷の双斧
{
    let skillId = Weapon.ArcadianAxes;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpursWithoutSpd(-5);
                let amount = Math.trunc(targetUnit.getResInPrecombat() * 0.2);
                enemyUnit.addSpursWithoutSpd(-amount);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getEvalResInCombat(enemyUnit) >=
                            enemyUnit.getEvalResInCombat(targetUnit) + 5) {
                            if (isNormalAttackSpecial(enemyUnit.special)) {
                                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                            }
                        }
                    }
                );
            }
        }
    );
}

// 刃の葬り手の爪
{
    let skillId = Weapon.QuietingClaw;
    WeaponTypesAddAtk2AfterTransform[skillId] = 0;
    BeastCommonSkillMap.set(skillId, BeastCommonSkillType.Flying);
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                for (let nearestEnemies of this.__findNearestEnemies(skillOwner)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(nearestEnemies, 2, true)) {
                        unit.reserveToApplyDebuffs(0, -7, -7, 0);
                        unit.reserveToAddStatusEffect(StatusEffectType.Exposure);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = 0;
                let statusCount = 0;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                    if (unit.hasPositiveStatusEffect() ||
                        unit.hasNegativeStatusEffect()) {
                        count++;
                    }
                    statusCount += unit.getPositiveStatusEffects().length;
                    statusCount += unit.getNegativeStatusEffects().length;
                }
                statusCount += enemyUnit.getPositiveStatusEffects().length;
                statusCount += enemyUnit.getNegativeStatusEffects().length;
                this.writeDebugLog(`有利・不利な状態を受けた周囲2マスの敵の数: ${count}`);
                this.writeDebugLog(`敵と周囲2マスの敵の有利・不利な状態の数: ${statusCount}`);
                let amount = Math.min(count * 3 + 4, 10);
                enemyUnit.addSpursWithoutRes(amount);
                // 固定ダメージ
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    atkUnit.battleContext.additionalDamage += statusCount * 3;
                });
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return 0.4;
                });
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        }
    );
}

// 王者の刃
{
    let skillId = Weapon.BladeRoyale;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                unit.reserveToApplyBuffs(6, 6, 0, 0);
                unit.reserveToAddStatusEffect(StatusEffectType.NeutralizesPenalties);
            }
            if (found) {
                skillOwner.reserveToApplyBuffs(6, 6, 0, 0);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.NeutralizesPenalties);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
    );
}

// 予兆の風
{
    let skillId = Weapon.WindsOfChange;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.isBuffed || targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAtkSpdSpurs(5);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.hasPositiveStatusEffect(enemyUnit) ||
                    targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.addAtkSpdSpurs(5);
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) return;
                        let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                    });
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAtkSpdSpurs(5);
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                        targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                }
            }
        }
    );
}

// 影身の暗器
{
    let skillId = Weapon.ConstantDagger;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    for (let nearestEnemy of this.__findNearestEnemies(skillOwner, 5)) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(nearestEnemy, 2, true)) {
                            unit.reserveToApplyDebuffs(0, -6, -6, 0);
                            unit.reserveToAddStatusEffect(StatusEffectType.Discord);
                        }
                    }
                }
            }
        }
    );
    applyMovementSkillAfterCombatFuncMap.set(skillId,
        function (atkUnit, attackTargetUnit, executesTrap) {
            // 錬成と共通の効果
            let partners = this.__getPartnersInSpecifiedRange(atkUnit, 2);
            if (partners.length === 1) {
                let partner = partners[0];
                let func = (unit, target, tile) => this.__findTileAfterSwap(unit, target, tile);
                return this.__applyMovementAssist(atkUnit, partner, func, false, true, executesTrap);
            }
            return false;
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat) {
                    targetUnit.addAtkSpdSpurs(5);
                    if (this.__isTherePartnerInSpace2(targetUnit)) {
                        targetUnit.battleContext.invalidatesCounterattack = true;
                    }
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAtkSpdSpurs(5);
                    // 固定ダメージ
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) return;
                        let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.1);
                    });
                    // 反撃不可
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) >
                                enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesCounterattack = true;
                            }
                        }
                    );
                    if (this.__isTherePartnerInSpace2(targetUnit)) {
                        targetUnit.battleContext.invalidatesCounterattack = true;
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAtkSpdSpurs(5);
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs.push(
                                (attackUnit, attackTargetUnit) => {
                                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                                        unit.reserveTakeDamage(7);
                                    }
                                }
                            );
                        }
                    }
                }
            }
        }
    );
}

// 幻影ロッド
{
    let skillId = Weapon.MirageRod;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (unit.isInCrossWithOffset(skillOwner, 1)) {
                            unit.reserveToApplyDebuffs(-6, 0, 0, -6);
                            unit.reserveToAddStatusEffect(StatusEffectType.Sabotage);
                        }
                    }
                }
            }
        }
    );
    updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            if (!enemyAllyUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.distance(enemyAllyUnit) <= 2) {
                    targetUnit.addAtkResSpurs(-6);
                }
            } else {
                // <錬成効果>
                if (targetUnit.distance(enemyAllyUnit) <= 2) {
                    targetUnit.addAtkResSpurs(-6);
                }
                if (enemyAllyUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.75, enemyUnit);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addAtkResSpurs(-5);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) return;
                            let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                        });
                        targetUnit.battleContext.healedHpAfterCombat += 7;
                    }
                }
            }
        }
    );
}

// 赤い竜騎士の斧
{
    let skillId = Weapon.DragoonAxe;
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (this.__isThereAllyIn2Spaces(skillOwner)) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                            unit.reserveToApplyBuffs(6, 6, 0, 0);
                            unit.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                        }
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.reducesCooldownCount = true;
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            }
        }
    );
}

// 自信家の長槍
{
    let skillId = Weapon.StoutheartLance;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        this.__applyDebuffReverse(targetUnit, targetUnit.weaponInfo.name);
                    }
                );
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
                if (targetUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) return;
                        atkUnit.battleContext.additionalDamage += 7;
                    });
                }
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        }
    );
}

// 近/遠影4
{
    let setSkill = (skillId, spurFunc, minMove) => {
        canActivateCantoFuncMap.set(skillId, function (unit) {
            // 無条件再移動
            return true;
        });
        calcMoveCountForCantoFuncMap.set(skillId, function () {
            return this.restMoveCount === 0 ? minMove : this.restMoveCount;
        });
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                spurFunc(enemyUnit);
            }
        );
        calcFixedAddDamageFuncMap.set(skillId,
            function (atkUnit, defUnit, isPrecombat) {
                atkUnit.battleContext.additionalDamage += 7;
            }
        );
    }
    // 近影
    // 速さ守備の近影4
    setSkill(PassiveB.SDNearTrace4, u => u.addSpdDefSpurs(-4), 2);

    // 遠影
    // 攻撃魔防の遠影4
    setSkill(PassiveB.AtkResFarTrace4, u => u.addAtkResSpurs(-4), 1);
    // 速さ魔防の遠影4
    setSkill(PassiveB.SpdResFarTrace4, u => u.addSpdResSpurs(-4), 1);
}

// 雷神の右腕
{
    let skillId = PassiveA.ThundersFist;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(7);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                });
            }
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                if (dist >= 2) {
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

// 魔器・雷公の書
{
    let skillId = Weapon.ArcaneThunder;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidateBuffs(false, true, false, true);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) >
                            enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                );
            }
        }
    );
}

// 攻防の暗器+
{
    let skillId = Weapon.CleverDaggerPlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
    );
}

// リペア
{
    let skillId = Weapon.Repair;
    applyHealSkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                unit.reserveHeal(20);
            }
        }
    );
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                unit.reserveToResetDebuffs();
                unit.reserveToClearNegativeStatusEffects();
                unit.reserveToApplyBuffs(4, 4, 4, 4);
            }
            skillOwner.reserveToResetDebuffs();
            skillOwner.reserveToClearNegativeStatusEffects();
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
            }
        }
    );
}

// 神罰・拍節
{
    let skillId = PassiveB.WrathfulTempo;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            enemyUnit.addSpdResSpurs(-4);
            targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                    enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
            );
        }
    );
}

// シーフ
{
    let skillId = Weapon.Thief;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let enemies = [];
            let maxEffectCount = 0;
            for (let enemy of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                let effectCount = enemy.getPositiveStatusEffects().length;
                if (effectCount > maxEffectCount) {
                    maxEffectCount = effectCount;
                    enemies = [enemy];
                } else if (effectCount === maxEffectCount) {
                    enemies.push(enemy);
                }
            }
            this.writeDebugLog(`${skillOwner.nameWithGroup}のシーフの対象キャラ: ${enemies.map(u => u.nameWithGroup)}(${enemies.length})`);
            // ステータス付与予約
            let statusSet = new Set();
            enemies.forEach(enemy => enemy.getPositiveStatusEffects().forEach(e => {
                this.writeDebugLog(`シーフにより${enemy.nameWithGroup}から${getStatusEffectName(e)}を解除`);
                statusSet.add(e);
            }));
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                // ステータス
                for (let statusEffect of statusSet) {
                    unit.reserveToAddStatusEffect(statusEffect);
                }
                // 強化
                enemies.forEach(enemy => {
                    let buffs = enemy.getBuffs(false);
                    unit.reserveToApplyBuffs(...buffs);
                    if (buffs.some(i => i > 0)) {
                        this.writeDebugLog(`シーフにより${enemy.nameWithGroup} → ${unit.nameWithGroup}へ強化${buffs}を付与`);
                    }
                });
            }
            // ステータス解除予約
            for (let enemy of enemies) {
                // 現在付与されているステータスについて解除予約する（このターン予約分は解除できない）
                enemy.getPositiveStatusEffects().forEach(e => enemy.reservedStatusEffectToDeleteSet.add(e));
                enemy.reservedStatusesToDelete = [true, true, true, true];
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(6);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let n = Math.min(atkUnit.getPositiveStatusEffects().length * 5, 20);
                    // Nダメージ
                    atkUnit.battleContext.additionalDamage += n;
                });
            }
        }
    );
    updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            // 縦横3列デバフ
            if (enemyAllyUnit.isInCrossWithOffset(targetUnit, 1)) {
                targetUnit.addAllSpur(-4);
            }
        }
    );
}

// 神祖竜のブレス
{
    let skillId = Weapon.PrimordialBreath;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
            } else {
                // <錬成効果>
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (isDefenseSpecial(skillOwner.special)) {
                        skillOwner.reserveToReduceSpecialCount(2);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.increaseCooldownCountForAttack = true;
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.increaseCooldownCountForBoth();
                    targetUnit.battleContext.damageReductionValueOfFirstAttacks += 7;
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
                        // 回避
                        targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                            return 0.3;
                        });
                        targetUnit.battleContext.healedHpAfterCombat += 7;
                    }
                }
            }
        }
    );
    // 回避
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (defUnit.isWeaponSpecialRefined) {
                if (defUnit.battleContext.restHpPercentage >= 25) {
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(0.3);
                }
            }
        }
    );
}

// 業炎フォルブレイズ
{
    let skillId = Weapon.StudiedForblaze;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
            } else {
                if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                    skillOwner.reduceSpecialCount(1);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAtkResSpurs(6);
                }
            } else {
                // <錬成効果>
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.initiatesCombat ||
                        this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAtkResSpurs(5);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
            }
        }
    );
    canDisableAttackOrderSwapSkillFuncMap.set(skillId,
        function (restHpPercentage, defUnit) {
            // 錬成で共通
            return restHpPercentage >= 25;
        }
    );
    calcFixedAddDamageFuncMap.set(skillId,
        function (atkUnit, defUnit, isPrecombat) {
            if (atkUnit.isWeaponSpecialRefined) {
                let status = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
            }
        }
    );
}

// 天与の魔道・承
{
    let skillId = Special.GiftedMagic2;
    // 範囲奥義
    RangedAttackSpecialDict[skillId] = 0;
    RangedAttackSpecialDamageRateDict[skillId] = 1;

    // 十字範囲
    enumerateRangedSpecialTilesFuncMap.set(skillId,
        function* (targetTile) {
            yield targetTile;
            yield this.getTile(targetTile.posX - 1, targetTile.posY);
            yield this.getTile(targetTile.posX + 1, targetTile.posY);
            yield this.getTile(targetTile.posX, targetTile.posY - 1);
            yield this.getTile(targetTile.posX, targetTile.posY + 1);
        }
    );

    applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap.set(skillId,
        function (attackUnit, attackTargetUnit, attackCount) {
            if (attackUnit.battleContext.isSpecialActivated) {
                let ax = attackUnit.posX;
                let ay = attackUnit.posY;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                    let ux = unit.posX;
                    let uy = unit.posY;
                    if ((ax - 1 <= ux && ux <= ax + 1) ||
                        (ay - 1 <= uy && uy <= ay + 1)) {
                        unit.addStatusEffect(StatusEffectType.Canto1);
                    }
                }
            }
        }
    );
}

// 反竜穿・承
{
    let skillId = Special.NegatingFang2;
    // 守備奥義
    DefenseSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);
    inheritableCount3Specials.push(skillId);

    // 奥義によるダメージ軽減
    applyDamageReductionRatioBySpecialFuncMap.set(skillId,
        function (defUnit, atkUnit, attackRange) {
            defUnit.battleContext.damageReductionRatioBySpecial = 0.4;
        }
    );

    // 奥義発動後、自分の次の攻撃のスキル効果を発動
    activatesNextAttackSkillEffectAfterSpecialActivatedFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            defUnit.battleContext.nextAttackEffectAfterSpecialActivated = true;
        }
    );

    // 奥義発動後のスキル効果
    // 奥義を発動したユニットがtargetUnit
    applySkillEffectAfterSpecialActivatedFuncMap.set(skillId,
        function (targetUnit, enemyUnit, context) {
            if (targetUnit.battleContext.specialActivatedCount === 1) {
                let isAttackTwice =
                    (targetUnit.battleContext.initiatesCombat && enemyUnit.battleContext.counterattackCount === 2) ||
                    (enemyUnit.battleContext.initiatesCombat && enemyUnit.battleContext.attackCount === 2);
                if (isAttackTwice) {
                    this.writeDebugLog(`${targetUnit.nameWithGroup}の奥義発動直後の奥義カウントが${targetUnit.tmpSpecialCount}から2減少`);
                    this.__reduceSpecialCount(targetUnit, 2);
                }
            }
        }
    );

    // 攻撃を受けた時に発動する奥義発動後の攻撃のダメージ加算
    addSpecialDamageAfterDefenderSpecialActivatedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            // 自分の攻撃の40%
            if (atkUnit.battleContext.nextAttackEffectAfterSpecialActivated) {
                atkUnit.battleContext.nextAttackEffectAfterSpecialActivated = false;
                return floorNumberWithFloatError(atkUnit.getAtkInCombat(defUnit) * 0.4);
            }
            return 0;
        }
    );
}

// 辰年の幼姫の竜石+
{
    let skillId = Weapon.NewSunStonePlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let amount = Math.trunc(targetUnit.getAtkInCombat(enemyUnit) * 0.15);
                        targetUnit.battleContext.damageReductionValueOfFirstAttacks += amount;
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                );
            }
        }
    );
}

// 2種混乱3
{
    const setSabotageFuncs = (skillId, indices, spurFunc) => {
        let reservedDebuffs = [0, 0, 0, 0];
        let debuffs = [-6, -6, -6, -6];
        reservedDebuffs[indices[0]] = debuffs[indices[0]];
        reservedDebuffs[indices[1]] = debuffs[indices[1]];
        applySkillForBeginningOfTurnFuncMap.set(skillId,
            function (skillOwner) {
                this.__applySabotageSkill(skillOwner, u => u.reserveToApplyDebuffs(...reservedDebuffs), 1);
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getEvalResInCombat(enemyUnit) > enemyUnit.getEvalResInCombat(targetUnit)) {
                            spurFunc(enemyUnit, -3, -3);
                            let maxDebuffs = this.__maxDebuffsFromAlliesWithinSpecificSpaces(enemyUnit);
                            spurFunc(enemyUnit, maxDebuffs[indices[0]], maxDebuffs[indices[1]]);
                        }
                    }
                );
            }
        );
    };

    // 攻撃魔防の混乱3
    setSabotageFuncs(PassiveB.SabotageAR3, [0, 3], (u, v1, v2) => u.addAtkResSpurs(v1, v2));
    // 速さ魔防の混乱3
    setSabotageFuncs(PassiveB.SabotageSR3, [1, 3], (u, v1, v2) => u.addSpdResSpurs(v1, v2));
}

// 竜眼
{
    let getScowlFunc = (spurFunc, threshold) => {
        return function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                spurFunc(targetUnit);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (isNormalAttackSpecial(enemyUnit.special)) {
                            let diff =
                                targetUnit.getEvalResInCombat(enemyUnit) -
                                enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= threshold) {
                                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack++;
                            }
                        }
                    }
                );
            }
        }
    };
    applySkillEffectForUnitFuncMap.set(PassiveA.AtkResScowl3, getScowlFunc(u => u.addAtkResSpurs(6), 9));
    applySkillEffectForUnitFuncMap.set(PassiveA.AtkResScowl4, getScowlFunc(u => u.addAtkResSpurs(7), 5));
    applySkillEffectForUnitFuncMap.set(PassiveA.AtkSpdScowl4, getScowlFunc(u => u.addAtkSpdSpurs(7), 5));
    applySkillEffectForUnitFuncMap.set(PassiveA.DefResScowl4, getScowlFunc(u => u.addDefResSpurs(7), 5));
}

// 共に未来を変えて
{
    let skillId = PassiveC.FutureSighted;
    applyAfterEnemySkillsSkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let units = [];
            let distance = Number.MAX_SAFE_INTEGER;
            for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                if (!skillOwner.isInCrossOf(unit)) {
                    continue;
                }
                let d = skillOwner.distance(unit);
                if (d > distance) continue;
                if (d === distance) {
                    units.push(unit);
                } else {
                    units = [unit]
                    distance = d;
                }
            }
            for (let unit of units) {
                if (skillOwner.getResInPrecombat() >= unit.getResInPrecombat() + distance * 3 - 5) {
                    if (!unit.hasStatusEffect(StatusEffectType.TimesGrip)) {
                        unit.endAction();
                        // TODO: 予約が必要になれば予約を実装する
                        unit.addStatusEffect(StatusEffectType.TimesGrip);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
    );
}

// 女神姉妹の手毬
{
    let skillId = Weapon.GoddessTemari;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        return g_appData.currentTurn >= 2;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 1;
    });
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                    unit.reserveToApplyBuffs(6, 0, 0, 6);
                    unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let turn = this.globalBattleContext.currentTurn;
                let hasTimesGrip = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                    if (unit.hasStatusEffect(StatusEffectType.TimesGrip)) {
                        hasTimesGrip = true;
                        break;
                    }
                }
                if (targetUnit.hasStatusEffect(StatusEffectType.TimesGate) || hasTimesGrip) {
                    turn = Math.max(turn, 4);
                }
                targetUnit.addAllSpur(Math.min(turn * 2, 8));
                if (turn >= 3) {
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) return;
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 2);
                        let buffTotal = this.__getHighestTotalBuff(atkUnit, defUnit, units, true); // 自分を含む場合はtrueを指定
                        atkUnit.battleContext.additionalDamage += buffTotal;
                    });
                }
                if (turn >= 4) {
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                if (targetUnit.getEvalResInCombat(enemyUnit) >=
                                    enemyUnit.getEvalResInCombat(targetUnit) + 5) {
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
                        );
                    }
                }
            }
        }
    );
}

// 辰年の御子の竜石+
{
    let skillId = Weapon.DragonsStonePlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let amount = Math.trunc(targetUnit.getSpdInCombat(enemyUnit) * 0.20);
                        targetUnit.battleContext.damageReductionValueOfFirstAttacks += amount;
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                );
            }
        }
    );
}

// 歩行の見切り追撃4
{
    let skillId = PassiveC.InfNullFollow4;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                found |= true;
                if (unit.moveType === MoveType.Infantry) {
                    unit.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                }
            }
            if (found) {
                skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
            }
        }
    );
}

// 過去の女神の扇子
{
    let skillId = Weapon.FadedPaperFan;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.2);
                targetUnit.addSpdResSpurs(-amount);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                if (targetUnit.battleContext.initiatesCombat) {
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.7, enemyUnit);
                    }
                } else if (enemyUnit.battleContext.initiatesCombat) {
                    if (!targetUnit.isOneTimeActionActivatedForWeapon2) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.7, enemyUnit);
                    }
                }
                targetUnit.battleContext.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs.push(
                    (attackUnit, attackTargetUnit) => {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                        }
                    }
                );
            }
        }
    );
}

// 野生
{
    let generatePrimeFunc = func => function (targetUnit, enemyUnit, calcPotentialDamage) {
        let pred = unit => !isWeaponTypeBreathOrBeast(unit.weaponType);
        if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1, pred) <= 1 ||
            targetUnit.isTransformed) {
            func(targetUnit);
            targetUnit.battleContext.increaseCooldownCountForBoth();
            targetUnit.battleContext.healedHpAfterCombat += 7;
        }
    };
    // 攻撃速さの野生
    applySkillEffectForUnitFuncMap.set(PassiveA.AtkSpdWild, generatePrimeFunc(u => u.addAtkSpdSpurs(7)));
}

// 地の女神の折り鶴
{
    let skillId = Weapon.CutePaperCrane;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 2;
    });
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = targetUnit.maxSpecialCount * 2;
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let amount = Math.trunc(targetUnit.getSpdInCombat(enemyUnit) * 0.25);
                        targetUnit.battleContext.damageReductionValueOfFirstAttacks += amount;
                    }
                );
            }
        }
    );
    WeaponTypesAddAtk2AfterTransform[skillId] = 0;
    BeastCommonSkillMap.set(skillId, BeastCommonSkillType.Cavalry2);
}

// 死の瘴気
{
    let skillId = PassiveC.DeadlyMiasma;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                enemyUnit.addAllSpur(-5);
                targetUnit.battleContext.invalidateAllBuffs();
                targetUnit.battleContext.applySkillEffectAfterCombatForUnitFuncs.push(
                    (targetUnit, enemyUnit) => {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                            unit.reserveTakeDamage(7);
                        }
                    }
                );
            }
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let enemyTile = enemyUnit.placedTile;
            if (targetUnit.battleContext.initiatesCombat) {
                for (let tile of this.map.enumerateTiles()) {
                    if (tile.calculateDistance(enemyTile) <= 2) {
                        tile.reserveDivineVein(DivineVeinType.Haze, targetUnit.groupId);
                    }
                }
            }
        }
    );
}

// 可愛がってあげる
{
    let skillId = PassiveB.SpoilRotten;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                let enemies = this.__findNearestEnemies(skillOwner);
                for (let nearestEnemy of this.__findNearestEnemies(skillOwner)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(nearestEnemy, 2, true)) {
                        unit.reserveToApplyDebuffs(0, -7, 0, -7);
                        unit.reserveToAddStatusEffect(StatusEffectType.Sabotage);
                    }
                }
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.ReducesPercentageOfFoesNonSpecialReduceDamageSkillsBy50Percent);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpdResSpurs(-5);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
    );
}

// 妖艶なる夜の書
{
    let skillId = Weapon.BewitchingTome;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        // 無条件再移動
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 1;
    });
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                isRangedWeaponType(enemyUnit.weaponType)) {
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let advantageous = DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit);
                        let isAdvantageous = advantageous === TriangleAdvantage.Advantageous;
                        let spdCond = targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit);
                        let enemyAtk = enemyUnit.getAtkInCombat(targetUnit);
                        let ratio = isAdvantageous || spdCond ? 0.4 : 0.2;
                        let damage = Math.trunc(enemyAtk * ratio);
                        this.writeDebugLog(`${targetUnit.nameWithGroup}の${targetUnit.weaponInfo.name}により戦闘開始後ダメージ+${damage}。enemy atk: ${enemyAtk}, ratio: ${ratio}`);
                        enemyUnit.battleContext.damageAfterBeginningOfCombat += damage;
                    }
                );
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.2);
                targetUnit.addAtkSpdSpurs(amount);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
}

// 恐慌の幻煙4
{
    let skillId = PassiveC.PanicSmoke4;
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                unit.applyAllDebuff(-3);
                unit.addStatusEffect(StatusEffectType.Panic);
            }
            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, true)) {
                if (unit.posX === targetUnit.posX ||
                    unit.posY === targetUnit.posY) {
                    unit.addStatusEffect(StatusEffectType.FoePenaltyDoubler);
                }
            }
        }
    );
}

// 金鹿の聖夜の弓+
{
    let skillId = Weapon.GoldenYuleBowPlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                if (enemyUnit.hasNegativeStatusEffect()) {
                    dist = 3;
                }
                let amount = Math.min(dist, 3);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += amount;
            }
        }
    );
    isAfflictorFuncMap.set(skillId,
        function (attackUnit, lossesInCombat) {
            return !lossesInCombat;
        }
    );
}

// 守備隊形
{
    let setSkill = (skillId, func) => {
        applySkillEffectRelatedToFollowupAttackPossibilityFuncMap.set(skillId,
            function (targetUnit, enemyUnit) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    let ratio = enemyUnit.battleContext.canFollowupAttackIncludingPotent() ? 0.8 : 0.4;
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(ratio, enemyUnit);
                }
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    func(enemyUnit);
                    targetUnit.battleContext.followupAttackPriorityDecrement--;
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    targetUnit.battleContext.multDamageReductionRatioOfFollowupAttack(0.4, enemyUnit);
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
            }
        );
    }
    // 理の守備隊形
    setSkill(PassiveB.WeavingFighter, u => u.addAtkDefSpurs(-4));
    // 魔の守備隊形
    setSkill(PassiveB.CannyFighter, u => u.addAtkResSpurs(-4));
}

// 真覇天
{
    let skillId = Special.SupremeHeaven;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count2Specials.push(skillId);
    inheritableCount2Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = targetUnit.getAtkInCombat(enemyUnit);
            let ratio = isWeaponTypeBreath(enemyUnit.weaponType) ? 0.5 : 0.25;
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * ratio));
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        }
    );

    // 攻撃奥義のダメージ軽減
    applyDamageReductionRatiosWhenCondSatisfiedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            if (defUnit.tmpSpecialCount === 0 ||
                atkUnit.tmpSpecialCount === 0 ||
                defUnit.battleContext.isSpecialActivated ||
                atkUnit.battleContext.isSpecialActivated) {
                if (defUnit.battleContext.restHpPercentage >= 25 &&
                    isRangedWeaponType(atkUnit.weaponType)) {
                    defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.3);
                }
            }
        }
    );
}

// 師の聖夜の剣
{
    let skillId = Weapon.HolyYuleBlade;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addSpursWithoutSpd(5);
                let res = targetUnit.getResInPrecombat();
                targetUnit.addSpursWithoutSpd(Math.trunc(res * 0.2));
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (isNormalAttackSpecial(enemyUnit.special)) {
                            let diff =
                                targetUnit.getEvalResInCombat(enemyUnit) -
                                enemyUnit.getEvalResInCombat(targetUnit);
                            if (diff >= 5) {
                                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                                if (targetUnit.isSaviorActivated) {
                                    dist = 3;
                                }
                                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += Math.min(dist, 3);
                            }
                        }
                    }
                );
                if (isRangedWeaponType(enemyUnit.weaponType)) {
                    targetUnit.battleContext.nullCounterDisrupt = true;
                }
            }
        }
    );
}

// 真無惨
{
    let skillId = PassiveB.Barbarity;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addSpursWithoutRes(-4);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.25);
                });
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
            }
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addStatusEffect(StatusEffectType.Vantage);
                targetUnit.addStatusEffect(StatusEffectType.Dodge);
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 3, true)) {
                    unit.applyAllDebuff(-6);
                }
            }
        }
    );
}

// 車懸
{
    let skillId = Special.NoQuarter;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);
    inheritableCount3Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = targetUnit.getAtkInCombat(enemyUnit);
            let ratio = enemyUnit.moveType === MoveType.Armor ? 0.4 : 0.3;
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * ratio));
            targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
        }
    );
}

// 青獅子の聖夜の斧
{
    let skillId = Weapon.BlueYuleAxe;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        // 無条件再移動
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 2;
    });
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                skillOwner.reserveToApplyBuffs(6, 6, 0, 0);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.addAllSpur(Math.trunc(targetUnit.getSpdInPrecombat() * 0.15));
                let dist = Unit.calcAttackerMoveDistance(targetUnit, enemyUnit);
                if (targetUnit.getPositiveStatusEffects().length >= 4) {
                    dist = 3;
                }
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += Math.min(dist, 3);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
}

// 真狂嵐
{
    let skillId = PassiveB.RagingTempest;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                if (unit.isInCrossWithOffset(skillOwner, 1)) {
                    found = true;
                    break;
                }
            }
            if (found || skillOwner.battleContext.restHpPercentage === 100) {
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.Charge);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            let allyCount = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1);
            if (allyCount <= 1) {
                enemyUnit.addAtkDefSpurs(-5);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                });
            }
        }
    );
    applySkillEffectAfterMovementSkillsActivatedFuncMap.set(skillId,
        function (atkUnit, defUnit, tileToAttack) {
            let allyCount = this.__countAlliesWithinSpecifiedSpaces(atkUnit, 1);
            if (allyCount <= 1) {
                if (atkUnit.battleContext.initiatesCombat) {
                    if (!atkUnit.isOneTimeActionActivatedForPassiveB &&
                        atkUnit.isActionDone) {
                        this.writeLogLine(`${atkUnit.getNameWithGroup()}は${atkUnit.passiveBInfo.name}により再行動`);
                        atkUnit.isActionDone = false;
                        atkUnit.isOneTimeActionActivatedForPassiveB = true;
                    }
                }
            }
        }
    );
}

// 備え4
{
    let generatePrimeFunc = func => function (targetUnit, enemyUnit, calcPotentialDamage) {
        if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
            let positiveCount = targetUnit.getPositiveStatusEffects().length;
            let amount = Math.min(positiveCount * 2 + 3, 9);
            func(targetUnit, amount);
            if (positiveCount >= 4) {
                targetUnit.battleContext.canCounterattackToAllDistance = true;
            }
        }
    };
    applySkillEffectForUnitFuncMap.set(PassiveA.AtkSpdPrime4, generatePrimeFunc((u, n) => u.addAtkSpdSpurs(n)));
    applySkillEffectForUnitFuncMap.set(PassiveA.AtkDefPrime4, generatePrimeFunc((u, n) => u.addAtkDefSpurs(n)));
}

// 重装の大炎
{
    let skillId = Special.ArmoredBlaze;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);
    inheritableCount3Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = targetUnit.getDefInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.4));
        }
    );

    // 攻撃奥義のダメージ軽減
    applyDamageReductionRatiosWhenCondSatisfiedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            if (defUnit.tmpSpecialCount === 0 ||
                atkUnit.tmpSpecialCount === 0 ||
                defUnit.battleContext.isSpecialActivated ||
                atkUnit.battleContext.isSpecialActivated) {
                // 40%軽減
                if (isMeleeWeaponType(atkUnit.weaponType)) {
                    defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.4);
                }
            }
        }
    );
}

// 黒鷲の聖夜の槍
{
    let skillId = Weapon.BlackYuleLance;
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.restHpPercentage >= 25 &&
                targetUnit.battleContext.initiatesCombat) {
                this.__applyBlackEffect(targetUnit, enemyUnit);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-6);
                let allyCount = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1);
                let amount = Math.max(9 - allyCount * 2, 0);
                enemyUnit.addAtkDefSpurs(-amount);
                let dist = Math.min(Unit.calcAttackerMoveDistance(targetUnit, enemyUnit), 3);
                let tile = enemyUnit.placedTile;
                let onFlame =
                    tile.divineVein === DivineVeinType.Flame &&
                    tile.divineVeinGroup === targetUnit.groupId;
                if (onFlame) {
                    dist = 3;
                }
                let ratio = Math.max(1 - 3.0 * allyCount / 100.0, 0);
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(ratio);
                targetUnit.battleContext.specialCountReductionBeforeFirstAttack += Math.min(dist, 3);
                let advantageType = DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit);
                if (advantageType === TriangleAdvantage.Advantageous || onFlame) {
                    targetUnit.battleContext.neutralizesNonSpecialMiracle = true;
                }
            }
        }
    );
}

// 理の蛇毒
{
    let skillId = PassiveB.AssassinsStrike;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                enemyUnit.battleContext.damageAfterBeginningOfCombat += 7;
                enemyUnit.addSpdDefSpurs(-4);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getDef(defUnit, atkUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
            }
        }
    );
}

// 見えざる聖夜の刃
{
    let skillId = Weapon.SilentYuleKnife;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        // 無条件再移動
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        let dist = Unit.calcMoveDistance(this)
        return Math.min(dist, 3);
    });
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1);
                let amount = Math.max(9 - count * 2, 0);
                targetUnit.addAtkSpdSpurs(amount);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
                if (targetUnit.battleContext.initiatesCombat) {
                    let dist = Math.min(Unit.calcAttackerMoveDistance(targetUnit, enemyUnit), 3);
                    let found = false;
                    for (let tile of this.map.enumerateTilesWithinSpecifiedDistance(targetUnit.placedTile, 2)) {
                        if (tile.divineVein !== DivineVeinType.None) {
                            found = true;
                            break;
                        }
                        let satisfiedTile = !(tile.type === TileType.Normal || tile.type === TileType.Wall);
                        if (satisfiedTile) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        dist = 3;
                    }
                    let ratio = 0.3 * dist;
                    targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(ratio);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(ratio, enemyUnit);
                }
            }
        }
    );
}

// 若き狼の鋭弓
{
    let skillId = Weapon.SacaenWolfBow;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                    targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    );
                }
            }
        }
    );
}

// バルムンク
{
    let skillId = Weapon.Balmung;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage === 100) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    targetUnit.addAllSpur(5);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.battleContext.invalidateAllOwnDebuffs();
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                            enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    );
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.15);
                        targetUnit.addAllSpur(amount);
                        targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                            return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                        });
                    }
                }
            }
        }
    );
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (defUnit.isWeaponSpecialRefined && defUnit.battleContext.restHpPercentage >= 25) {
                // 速度回避
                let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
            }
        }
    );
}

// 幻影ロングボウ
{
    let skillId = Weapon.GeneiLongBow;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) >
                            enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesCounterattack = true;
                        }
                    }
                );
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAtkSpdSpurs(5);
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) return;
                        let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                    });
                    targetUnit.battleContext.invalidatesCounterattack = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAtkSpdSpurs(5);
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                        targetUnit.battleContext.invalidateBuffs(false, true, true, false);
                    }
                }
            }
        }
    );
    resetMaxSpecialCountFuncMap.set(skillId,
        function () {
            if (this.isWeaponSpecialRefined) {
                return -1;
            } else {
                return 0;
            }
        }
    );
}

// 白き飛翔の槍
{
    let skillId = Weapon.WhitedownSpear;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat) {
                    if (this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.moveType === MoveType.Flying) >= 3) {
                        enemyUnit.addAtkDefSpurs(-4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                    targetUnit.battleContext.setAttackCountFuncs.push(
                        (targetUnit, enemyUnit) => {
                            let allyCount = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType === MoveType.Flying
                            );
                            if (targetUnit.battleContext.initiatesCombat && allyCount >= 2) {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                    );
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat ||
                    this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                    if (this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.moveType === MoveType.Flying) >= 3) {
                        enemyUnit.addSpursWithoutRes(-4);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                }
                targetUnit.battleContext.setAttackCountFuncs.push(
                    (targetUnit, enemyUnit) => {
                        let allyCount = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3,
                            x => x.moveType === MoveType.Flying
                        );
                        if (targetUnit.battleContext.initiatesCombat && allyCount >= 2) {
                            targetUnit.battleContext.attackCount = 2;
                            targetUnit.battleContext.counterattackCount = 2;
                        }
                    }
                );
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (isPrecombat) return;
                            let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                        });
                        let count = 0;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                            if (unit.moveType === MoveType.Flying) {
                                count++;
                            }
                        }
                        if (count >= 2) {
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                    }
                }
            }
        }
    );
    canActivateCantoFuncMap.set(skillId, function (unit) {
        let pred = unit => unit.moveType === MoveType.Flying;
        return unit.isWeaponSpecialRefined && this.__isThereAllyInSpecifiedSpaces(unit, 3, pred);
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        // 再移動残り+1
        return this.restMoveCount + 1;
    });
}

// マクベスの惑書
{
    let skillId = Weapon.IagosTome;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (!skillOwner.isWeaponRefined) {
                // <通常効果>
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (this.__isNextToOtherUnits(unit)) {
                            continue;
                        }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3))) {
                            continue;
                        }
                        unit.reserveToApplyAtkDebuff(-4);
                        unit.reserveToApplySpdDebuff(-4);
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                } else {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (!this.__isNextToOtherUnits(unit)) {
                            continue;
                        }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3))) {
                            continue;
                        }
                        unit.reserveToApplyDefDebuff(-4);
                        unit.reserveToApplyResDebuff(-4);
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
            } else {
                // <錬成効果>
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (this.__isNextToOtherUnits(unit)) {
                            continue;
                        }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 1))) {
                            continue;
                        }
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                } else {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (!this.__isNextToOtherUnits(unit)) {
                            continue;
                        }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 1))) {
                            continue;
                        }
                        unit.reserveToApplyDefDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                if (skillOwner.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (this.isOddTurn) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                            unit.reserveToApplyBuffs(0, 0, 6, 6);
                            unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                            unit.reserveToAddStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                        }
                    } else {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                            unit.reserveToApplyBuffs(6, 6, 0, 0);
                            unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                            unit.reserveToAddStatusEffect(StatusEffectType.Hexblade);
                        }
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.isWeaponRefined) {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                    }
                }
            }
        }
    );
}

// 見切り追撃の剣+
{
    let skillId = Weapon.NullBladePlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                );
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                        atkUnit.battleContext.additionalDamage += 5;
                    }
                });
            }
        }
    );
}

// 禁書ギムレー
{
    let skillId = Weapon.GrimlealText;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            /** @type {Unit[] | Generator<Unit>} */
            let units = this.enumerateUnitsInDifferentGroupOnMap(skillOwner);
            for (let unit of units) {
                if (skillOwner.isInCrossWithOffset(unit, 1)) {
                    if (unit.statusEvalUnit.getEvalResInPrecombat() <
                        skillOwner.statusEvalUnit.getEvalResInPrecombat()) {
                        unit.reserveToApplyDebuffs(0, 0, -6, -6);
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                        unit.reserveToAddStatusEffect(StatusEffectType.Discord);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkResSpurs(-6);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let amount = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                        amount += unit.getNegativeStatusEffects().length;
                    }
                    atkUnit.battleContext.additionalDamage += amount * 4;
                });
            }
        }
    );
}

// 回避・盾の鼓動4
{
    let skillId = PassiveB.Buffer4;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.globalBattleContext.currentTurn === 1) {
                if (isDefenseSpecial(skillOwner.special)) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
            }
        }
    );
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            // 速度回避
            let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit, 5, 50);
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            enemyUnit.addSpdDefSpurs(-4);
            targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit, 5, 50);
            });
        }
    );
    evalSpdAddFuncMap.set(skillId, function (unit) {
        return 7;
    })
}

// 憧憬の剣
{
    let skillId = Weapon.StrivingSword;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                let atk = enemyUnit.getAtkInPrecombat();
                let amount = Math.max(Math.min(Math.trunc(atk * 0.25) - 4, 14), 5);
                targetUnit.addAllSpur(amount);
                targetUnit.battleContext.reducesCooldownCount = true;
                targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                if (isDefenseSpecial(targetUnit.special)) {
                    targetUnit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttackAfterDefenderSpecial = true;
                }
            }
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.isSpecialActivated) {
                targetUnit.specialCount -= 2;
            }
        }
    );
}

// 守備魔防の奮進
{
    let skillId = PassiveC.AlarmDefRes;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 1) <= 2) {
                skillOwner.applyDefResBuffs(6);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.Canto1);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                targetUnit.addDefResSpurs(3);
            }
        }
    );
}

// 未来を変える瞳
{
    let skillId = Support.FutureSight;
    getTargetUnitTileAfterMoveAssistFuncMap.set(skillId, function (unit, targetUnit, assistTile) {
        return this.__findTileAfterSwap(unit, targetUnit, assistTile);
    });
    findTileAfterMovementAssistFuncMap.set(skillId, function (unit, target, tile) {
        return this.__findTileAfterSwap(unit, target, tile);
    });
    applySupportSkillForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit, supportTile) {
            if (!supporterUnit.isOneTimeActionActivatedForSupport) {
                supporterUnit.isActionDone = false;
                supporterUnit.isOneTimeActionActivatedForSupport = true;
            }
            supporterUnit.applyBuffs(6, 6, 0, 0);
            targetUnit.applyBuffs(6, 6, 0, 0);
            supporterUnit.addStatusEffect(StatusEffectType.Treachery);
            targetUnit.addStatusEffect(StatusEffectType.Treachery);
            supporterUnit.addStatusEffect(StatusEffectType.ReducesDamageFromFirstAttackBy40Percent);
            targetUnit.addStatusEffect(StatusEffectType.ReducesDamageFromFirstAttackBy40Percent);
        }
    );
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
        }
    );
}

// 魔器スリマ
{
    let skillId = Weapon.ArcaneThrima;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.battleContext.restHpPercentage >= 25) {
                let nearestEnemies = this.__findNearestEnemies(skillOwner);
                for (let nearestEnemy of nearestEnemies) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(nearestEnemy, 2, true)) {
                        unit.reserveToApplyDebuffs(-6, 0, -6, 0);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let debuffs = this.__maxDebuffsFromAlliesWithinSpecificSpaces(enemyUnit, 2, true);
                        enemyUnit.addSpurs(...debuffs);
                    }
                );
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getSpdInCombat(enemyUnit) >= enemyUnit.getSpdInCombat(targetUnit) + 1) {
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                );
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
    );
}

// 絶対化身・敏捷4
{
    let skillId = PassiveB.BeastAgility4;
    hasTransformSkillsFuncMap.set(skillId, function () {
        return true;
    });
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            enemyUnit.addSpdDefSpurs(-4);
            targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    if (targetUnit.getSpdInCombat(enemyUnit) >= enemyUnit.getSpdInCombat(targetUnit) + 1) {
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                }
            );
            targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                if (isPrecombat) return;
                let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.1);
            });
        }
    );
}

// 世界樹の栗鼠の尻尾
{
    let skillId = Weapon.WorldTreeTail;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        // 無条件再移動
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        // 再移動N
        return 2;
    });
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let count = 0;
                for (let ally of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (ally.battleContext.restHpPercentage <= 40) {
                        count++;
                    }
                }
                let amount = Math.max(9 - count * 3, 0)
                targetUnit.addAtkSpdSpurs(amount);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.4, enemyUnit);
            }
        }
    );
    WeaponTypesAddAtk2AfterTransform[skillId] = 0;
    BeastCommonSkillMap.set(skillId, BeastCommonSkillType.Cavalry2);
}

// 癒し手の心
{
    let skillId = PassiveC.MendingHeart;
    let divineFunc = function () {
        for (let tile of g_appData.map.enumerateTilesWithinSpecifiedDistance(this.placedTile, 2)) {
            tile.reserveDivineVein(DivineVeinType.Green, this.groupId);
        }
    };
    applyEndActionSkillsFuncMap.set(skillId, divineFunc);
    applySkillsAfterCantoActivatedFuncMap.set(skillId, divineFunc);
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                );
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
    applySkillEffectFromAlliesExcludedFromFeudFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            targetUnit.battleContext.healedHpAfterCombat += 7;
        }
    );
}

// 魔の蛇毒
{
    let skillId = PassiveB.OccultistsStrike;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                enemyUnit.battleContext.damageAfterBeginningOfCombat += 7;
                enemyUnit.addSpdResSpurs(-4);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getRes(defUnit, atkUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
            }
        }
    );
}

// 時は光
{
    let skillId = Special.TimeIsLight;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    // 奥義カウント設定(ダメージ計算機で使用。奥義カウント2-4の奥義を設定)
    count3Specials.push(skillId);

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = targetUnit.getSpdInCombat(enemyUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.45));
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
            );
        }
    );
    applyHighPriorityAnotherActionSkillEffectFuncMap.set(skillId,
        function (atkUnit, defUnit, tileToAttack) {
            if (atkUnit.battleContext.initiatesCombat &&
                atkUnit.battleContext.isSpecialActivated &&
                atkUnit.isAlive &&
                !atkUnit.isOneTimeActionActivatedForSpecial &&
                atkUnit.isActionDone) {
                let logMessage = `${atkUnit.getNameWithGroup()}は${atkUnit.specialInfo.name}により再行動`;
                this.writeLogLine(logMessage);
                this.writeSimpleLogLine(logMessage);
                atkUnit.isActionDone = false;
                atkUnit.isOneTimeActionActivatedForSpecial = true;
                atkUnit.addStatusEffect(StatusEffectType.Gravity);
            }
        }
    );
}

// 終端グルヴェイグ
{
    let skillId = Weapon.QuietusGullveig;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.15);
                targetUnit.addAtkSpdSpurs(amount);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            }
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.7, enemyUnit);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
    applySkillEffectAfterMovementSkillsActivatedFuncMap.set(skillId,
        function (atkUnit, defUnit, tileToAttack) {
            let logMessage = `${atkUnit.nameWithGroup}の武器スキル効果発動可能まで残り${atkUnit.restWeaponSkillAvailableTurn}ターン`;
            if (atkUnit.restWeaponSkillAvailableTurn === 0) {
                logMessage = `${atkUnit.nameWithGroup}の武器スキル効果は現在発動可能`;
            }
            this.writeLogLine(logMessage);
            this.writeSimpleLogLine(logMessage);
            if (atkUnit.restWeaponSkillAvailableTurn !== 0) {
                this.writeLog(`ターン制限により${atkUnit.nameWithGroup}の再行動スキル効果は発動せず`);
            }
            if (!atkUnit.isOneTimeActionActivatedForWeapon &&
                atkUnit.isActionDone &&
                atkUnit.restWeaponSkillAvailableTurn === 0) {
                logMessage = `${atkUnit.getNameWithGroup()}は${atkUnit.weaponInfo.name}により再行動`;
                this.writeLogLine(logMessage);
                this.writeSimpleLogLine(logMessage);
                atkUnit.restWeaponSkillAvailableTurn = 2;
                atkUnit.isActionDone = false;
                atkUnit.addStatusEffect(StatusEffectType.Gravity);
                atkUnit.isOneTimeActionActivatedForWeapon = true;
            }
        }
    );
}

// 奮激
{
    let setSkill = (skillId, statuses) => {
        // ターン開始時スキル
        applySkillForBeginningOfTurnFuncMap.set(skillId,
            function (skillOwner) {
                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 1) <= 2) {
                    skillOwner.reserveToApplyBuffs(...statuses.map(s => s * 6));
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Incited);
                }
            }
        );
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 1) <= 1) {
                    targetUnit.addSpurs(...statuses.map(s => s * 3));
                }
            }
        );
    };
    // 攻撃速さの奮激
    setSkill(PassiveC.InciteAtkSpd, [1, 1, 0, 0]);
    // 攻撃魔防の奮激
    setSkill(PassiveC.InciteAtkRes, [1, 0, 0, 1]);
}

// 速さ魔防の凪4
{
    let skillId = PassiveB.LullSpdRes4;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            enemyUnit.addSpdResSpurs(-4);
            let amount = Math.min(enemyUnit.getPositiveStatusEffects().length, 4);
            enemyUnit.addSpdResSpurs(-amount);
            targetUnit.battleContext.invalidatesSpdBuff = true;
            targetUnit.battleContext.invalidatesResBuff = true;
        }
    );
}

// 光は時
{
    let skillId = Special.LightIsTime;
    // 通常攻撃奥義(範囲奥義・疾風迅雷などは除く)
    NormalAttackSpecialDict[skillId] = 0;

    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            let status = enemyUnit.getAtkInCombat(targetUnit);
            targetUnit.battleContext.addSpecialAddDamage(Math.trunc(status * 0.6));
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
            );
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.initiatesCombat &&
                targetUnit.battleContext.isSpecialActivated &&
                targetUnit.isAlive) {
                let maxHP = 0;
                let units = [];
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                    if (!unit.isActionDone) {
                        continue;
                    }
                    if (unit.restHp > maxHP) {
                        maxHP = unit.restHp;
                        units = [unit];
                    } else if (unit.restHp === maxHP) {
                        units.push(unit);
                    }
                }
                if (units.length === 1) {
                    // 効果A
                    let unit = units[0];
                    unit.isActionDone = false;
                    if (isRangedWeaponType(unit.weaponType)) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                } else {
                    // 効果B
                    targetUnit.addStatusEffect(StatusEffectType.TimesGate);
                }
            }
        }
    );
}

// 始端クワシル
{
    let skillId = Weapon.IncipitKvasir;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                let amount = Math.trunc(targetUnit.getSpdInPrecombat() * 0.15);
                enemyUnit.addSpdResSpurs(-amount);
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                if (targetUnit.battleContext.initiatesCombat) {
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.7, enemyUnit);
                    }
                } else if (enemyUnit.battleContext.initiatesCombat) {
                    if (!targetUnit.isOneTimeActionActivatedForWeapon2) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.7, enemyUnit);
                    }
                }
                targetUnit.battleContext.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs.push(
                    (attackUnit, attackTargetUnit) => {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.addStatusEffect(StatusEffectType.Panic);
                        }
                    }
                );
            }
        }
    );
    setOnetimeActionActivatedFuncMap.set(skillId,
        function () {
            if (this.battleContext.initiatesCombat) {
                this.isOneTimeActionActivatedForWeapon = true;
            } else {
                this.isOneTimeActionActivatedForWeapon2 = true;
            }
        }
    );
    isAfflictorFuncMap.set(skillId,
        function (attackUnit, lossesInCombat, result) {
            if (attackUnit.battleContext.restHpPercentage >= 25) {
                if (result.atkUnit_actualTotalAttackCount > 0) {
                    return true;
                }
            }
            return false;
        }
    );
}

// 海賊の長の大斧
{
    let skillId = Weapon.CorsairCleaver;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                found = true;
                unit.reserveToApplyBuffs(6, 6, 0, 0);
                unit.reservedStatusEffects(StatusEffectType.AirOrders);
            }
            if (found) {
                skillOwner.reserveToApplyBuffs(6, 6, 0, 0);
                skillOwner.reservedStatusEffects(StatusEffectType.AirOrders);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                        enemyUnit.battleContext.reducesCooldownCount = false;
                    }
                );
            }
        }
    );
}

// 制止の弓+
{
    let skillId = Weapon.HaltingBowPlus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                enemyUnit.addAtkDefSpurs(-5);
                enemyUnit.battleContext.followupAttackPriorityDecrement--;
            }
        }
    );
}

// 響・飛燕の離撃
{
    let skillId = PassiveX.FleetingEcho;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.spdSpur += 2;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
            }
        }
    );
}

// 牙の絆
{
    let skillId = PassiveC.FangedTies;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.Canto1);
                let unit = this.__getStatusEvalUnit(skillOwner);
                if (unit.isSpecialCountMax) {
                    skillOwner.reserveToReduceSpecialCount(2);
                } else if (unit.maxSpecialCount - 1 === unit.specialCount) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
            }
        }
    );
}

// ゴンドゥル
{
    let skillId = Weapon.Gondul;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                found = true;
                unit.reserveToApplyBuffs(6, 6, 0, 0);
            }
            if (found) {
                skillOwner.reserveToApplyBuffs(6, 6, 0, 0);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                isRangedWeaponType(enemyUnit.weapon)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        // 周囲3マス以内の場合
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                        let amount = this.__getHighestTotalBuff(targetUnit, enemyUnit, units, true); // 自分を含む場合はtrueを指定
                        targetUnit.atkSpur += amount;
                        let amount2 = Math.trunc(amount * 0.5);
                        targetUnit.addSpursWithoutAtk(amount2);
                    }
                );
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttacks(0.3, enemyUnit);
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
}

// 影の勇者の黒剣
{
    let skillId = Weapon.TroublingBlade;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
    );
    TeleportationSkillDict[skillId] = 0;
    enumerateTeleportTilesForUnitFuncMap.set(skillId,
        function (unit) {
            return this.enumerateNearestTileForEachEnemyWithinSpecificSpaces(unit, 4);
        }
    );
}

// 速さ守備の干渉4
{
    let skillId = PassiveB.SpdDefSnag4;
    applyMovementAssistSkillFuncMap.set(skillId,
        function (unit1, unit2) {
            this.__applySnag4Skills(unit1, unit2, unit => unit.applyDebuffs(0, -7, -7, 0));
        }
    );
}

// 攻撃守備の干渉4
{
    let skillId = PassiveB.AtkDefSnag4;
    applyMovementAssistSkillFuncMap.set(skillId,
        function (unit1, unit2) {
            this.__applySnag4Skills(unit1, unit2, unit => unit.applyDebuffs(-7, 0, -7, 0));
        }
    );
}

// 守護騎士の白槍
{
    let skillId = Weapon.GuardingLance;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
            }
        }
    );
    let func = function (supporterUnit, targetUnit) {
        supporterUnit.applyBuffs(6, 6, 6, 0);
        targetUnit.applyBuffs(6, 6, 6, 0);
        supporterUnit.addStatusEffect(StatusEffectType.BonusDoubler);
        targetUnit.addStatusEffect(StatusEffectType.BonusDoubler);
        supporterUnit.addStatusEffect(StatusEffectType.FoePenaltyDoubler);
        targetUnit.addStatusEffect(StatusEffectType.FoePenaltyDoubler);
    };
    applyMovementAssistSkillFuncMap.set(skillId, func);
    applySkillsAfterRallyForSupporterFuncMap.set(skillId, func);
    applySkillsAfterRallyForTargetUnitFuncMap.set(skillId, func);
}

// 不治の幻煙4
{
    let skillId = PassiveC.FatalSmoke4;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            targetUnit.battleContext.invalidatesHeal = true;
            targetUnit.battleContext.neutralizesNonSpecialMiracle = true;
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                unit.addStatusEffect(StatusEffectType.DeepWounds);
                unit.addStatusEffect(StatusEffectType.NeutralizeUnitSurvivesWith1HP);
            }
        }
    );
}

// 虚無の王
{
    let skillId = PassiveB.RulerOfNihility;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            for (let nearestEnemy of this.__findNearestEnemies(skillOwner, 5)) {
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(nearestEnemy, 2, true)) {
                    unit.reserveToApplyDebuffs(-7, 0, -7, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.Discord);
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.restHpPercentage >= 75 ||
                enemyUnit.hasNegativeStatusEffect()) {
                enemyUnit.addAtkDefSpurs(-5);
                if (isNormalAttackSpecial(targetUnit.special)) {
                    targetUnit.battleContext.specialCountReductionBeforeFirstAttack += 1;
                }
            }
        }
    );
}


// 魔器ギンヌンガガプ
{
    let skillId = Weapon.ArcaneVoid;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let debuffs = this.__maxDebuffsFromAlliesWithinSpecificSpaces(enemyUnit, 2, true);
                        enemyUnit.addSpurs(...debuffs);
                    }
                );
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.increaseCooldownCountForBoth();
            }
        }
    );
}

// 地槍ゲイボルグ
{
    let skillId = Weapon.ChisouGeiborugu;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (enemyUnit.moveType === MoveType.Infantry ||
                    enemyUnit.moveType === MoveType.Armor ||
                    enemyUnit.moveType === MoveType.Cavalry) {
                    enemyUnit.addAtkDefSpurs(-5);
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                }
            } else {
                // <錬成効果>
                if (enemyUnit.moveType === MoveType.Infantry ||
                    enemyUnit.moveType === MoveType.Armor ||
                    enemyUnit.moveType === MoveType.Cavalry ||
                    targetUnit.battleContext.restHpPercentage >= 50) {
                    enemyUnit.addAtkDefSpurs(-5);
                    targetUnit.battleContext.invalidateBuffs(true, false, true, false);
                    targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalDefInCombat(enemyUnit) * 0.10);
                        }
                    );
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        enemyUnit.addAtkDefSpurs(-5);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                }
            }
        }
    );
}

// プージ
{
    let skillId = Weapon.Puji;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.restHpPercentage >= 50) {
                    targetUnit.battleContext.canCounterattackToAllDistance = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.canCounterattackToAllDistance = true;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        // 最初に受けた攻撃のダメージを軽減
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        // ダメージ軽減分を保存
                        targetUnit.battleContext.addReducedDamageForNextAttackFuncs.push(
                            (defUnit, atkUnit, damage, currentDamage, activatesDefenderSpecial, context) => {
                                if (!context.isFirstAttack(atkUnit)) return;
                                defUnit.battleContext.nextAttackAddReducedDamageActivated = true;
                                defUnit.battleContext.reducedDamageForNextAttack = damage - currentDamage;
                            }
                        );
                        // 攻撃ごとの固定ダメージに軽減した分を加算
                        targetUnit.battleContext.calcFixedAddDamagePerAttackFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            if (atkUnit.battleContext.nextAttackAddReducedDamageActivated) {
                                atkUnit.battleContext.nextAttackAddReducedDamageActivated = false;
                                let addDamage = atkUnit.battleContext.reducedDamageForNextAttack;
                                atkUnit.battleContext.reducedDamageForNextAttack = 0;
                                return addDamage;
                            }
                            return 0;
                        });
                        targetUnit.battleContext.healedHpAfterCombat += 7;
                    }
                }
            }
        }
    );
    canActivateObstructToAdjacentTilesFuncMap.set(skillId,
        function (unit, moveUnit) {
            return unit.isWeaponSpecialRefined && moveUnit.isMeleeWeaponType();
        }
    );
    canActivateObstructToTilesIn2SpacesFuncMap.set(skillId,
        function (unit, moveUnit) {
            return unit.isWeaponSpecialRefined && moveUnit.isRangedWeaponType();
        }
    );
}

// 幻影バトルアクス
{
    let skillId = Weapon.GeneiBattleAxe;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (this.__isThereAllyIn2Spaces(targetUnit) && !calcPotentialDamage) {
                    targetUnit.addDefResSpurs(6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                }
            } else {
                // <錬成効果>
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3) && !calcPotentialDamage) {
                    targetUnit.addAtkSpdSpurs(4);
                    targetUnit.addDefResSpurs(6);
                    enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    if (enemyUnit.battleContext.initiatesCombat) {
                        let count = this.__countEnemiesActionNotDone(targetUnit);
                        let amount = Math.max(Math.min(count * 3, 12), 6);
                        targetUnit.addDefResSpurs(amount);
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                }
            }
        }
    );
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, enemyUnit, calcPotentialDamage) {
            if (!allyUnit.isWeaponSpecialRefined) {
                return;
            }
            if (targetUnit.distance(allyUnit) <= 2) {
                targetUnit.addDefResSpurs(6);
            }
        }
    );
    applySkillEffectFromAlliesExcludedFromFeudFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (!allyUnit.isWeaponSpecialRefined) {
                return;
            }
            if (targetUnit.distance(allyUnit) <= 2) {
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
}

// 光明レイピア
{
    let skillId = Weapon.BrilliantRapier;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.invalidateBuffs(false, true, true, false);
            }
            if (targetUnit.battleContext.restHpPercentage <= 80 &&
                enemyUnit.battleContext.initiatesCombat) {
                targetUnit.battleContext.isVantageActivatable = true;
            }
            if (!targetUnit.isWeaponSpecialRefined) {
                return;
            }
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2);
                        let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units, true);
                        targetUnit.addSpurs(...amounts);
                    }
                );
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                });
            }
        }
    );
}

// 炎帝の烈斧
{
    let skillId = Weapon.FlameBattleaxe;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.isWeaponSpecialRefined) {
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (unit.isInCrossWithOffset(skillOwner, 1)) {
                        unit.reserveToApplyAtkDebuff(-7);
                        unit.reserveToAddStatusEffect(StatusEffectType.Sabotage);
                    }
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let amount = Math.max(15 - enemyUnit.maxSpecialCount * 2, 7);
                if (enemyUnit.special === Special.None) {
                    amount = 7;
                }
                enemyUnit.addAtkDefSpurs(-amount);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (enemyUnit.battleContext.initiatesCombat || enemyUnit.battleContext.restHpPercentage >= 75) {
                    enemyUnit.addAtkDefSpurs(-5);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
    );
}


// 豊潤の花
{
    let skillId = Weapon.FlowerOfPlenty;
    updateUnitSpurFromAlliesFuncMap.set(skillId,
        function (targetUnit, allyUnit, enemyUnit, calcPotentialDamage) {
            // 5×3マス以内にいる場合
            if (Math.abs(allyUnit.posX - targetUnit.posX) <= 1 &&
                Math.abs(allyUnit.posY - targetUnit.posY) <= 2) {
                if (!allyUnit.isWeaponRefined) {
                    targetUnit.addAtkResSpurs(3);
                } else {
                    targetUnit.addAtkResSpurs(4);
                }
            }
        }
    );
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                return;
            }
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                if (Math.abs(unit.posX - targetUnit.posX) <= 1 &&
                    Math.abs(unit.posY - targetUnit.posY) <= 2) {
                    found = true;
                    break;
                }
            }
            if (found) {
                targetUnit.addAtkResSpurs(5);
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAtkResSpurs(5);
                    targetUnit.battleContext.followupAttackPriorityIncrement++;
                }
            }
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.isWeaponSpecialRefined &&
                targetUnit.battleContext.restHpPercentage >= 25) {
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 1, true)) {
                    unit.addStatusEffect(StatusEffectType.Gravity);
                }
            }
        }
    );
}

// アラドヴァル
{
    let skillId = Weapon.Areadbhar;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                });
            }
            if (targetUnit.isWeaponRefined) {
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.battleContext.healedHpAfterCombat += 7;
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                            (targetUnit, enemyUnit, calcPotentialDamage) => {
                                enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                                enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                                enemyUnit.battleContext.reducesCooldownCount = false;
                            }
                        );
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                    }
                }
            }
        }
    );
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            // 速度回避
            if (defUnit.battleContext.restHpPercentage >= 25) {
                let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
            }
        }
    );
}


// 白夜忍の薙刀+
{
    let skillId = Weapon.KumoNaginataPlus;
    TeleportationSkillDict[skillId] = 0;
    enumerateTeleportTilesForUnitFuncMap.set(skillId,
        function (unit) {
            return this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
            }
        }
    );
}

// 鬼神明鏡の炎撃
{
    let skillId = PassiveA.FlaredMirror;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addAtkResSpurs(7, 10);
            }
        }
    );
    applySKillEffectForUnitAtBeginningOfCombatFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                enemyUnit.battleContext.damageAfterBeginningOfCombat += 7;
                let logMessage = `${targetUnit.passiveAInfo.name}により${enemyUnit.getNameWithGroup()}に<span style="color: #ff0000">${7}</span>ダメージ`;
                this.__writeDamageCalcDebugLog(logMessage);
                this._damageCalc.writeSimpleLog(logMessage);
            }
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.initiatesCombat) {
                this.__applyFlaredSkillEffect(targetUnit, enemyUnit);
            }
        }
    );
}

// 鬼神飛燕の炎撃
{
    let skillId = PassiveA.FlaredSparrow;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.addAtkSpdSpurs(7);
            }
        }
    );
    applySKillEffectForUnitAtBeginningOfCombatFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                enemyUnit.battleContext.damageAfterBeginningOfCombat += 7;
                let logMessage = `${targetUnit.passiveAInfo.name}により${enemyUnit.getNameWithGroup()}に<span style="color: #ff0000">${7}</span>ダメージ`;
                this.__writeDamageCalcDebugLog(logMessage);
                this._damageCalc.writeSimpleLog(logMessage);
            }
        }
    );
    applySkillEffectAfterCombatForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            if (targetUnit.battleContext.initiatesCombat) {
                this.__applyFlaredSkillEffect(targetUnit, enemyUnit);
            }
        }
    );
}

// 光炎の姉妹の忍法帖
{
    let skillId = Weapon.RadiantScrolls;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        // 無条件再移動
        return true;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return this.restMoveCount;
    });
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addAtkResSpurs(-6);
                targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        let debuffTotal = enemyUnit.debuffTotal;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2)) {
                            debuffTotal = Math.min(debuffTotal, unit.getDebuffTotal(true));
                        }
                        let amount = Math.abs(debuffTotal);
                        let ratio = Math.min(1, amount * 4 / 100.0);
                        this.writeDebugLog(`${targetUnit.weaponInfo.name}のデバフ参照値${amount}`);
                        this.writeDebugLog(`${targetUnit.weaponInfo.name}の効果により奥義以外のダメージ軽減を${ratio}無効`);
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(ratio);
                    }
                );
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let debuffTotal = defUnit.debuffTotal;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
                        debuffTotal = Math.min(debuffTotal, unit.getDebuffTotal(true));
                    }
                    let amount = Math.abs(debuffTotal);
                    this.writeDebugLog(`${targetUnit.weaponInfo.name}の効果により固定ダメージを${amount}追加`);
                    atkUnit.battleContext.additionalDamage += amount;
                });
            }
        }
    );
}

// 白夜忍の和弓+
{
    let skillId = Weapon.KumoYumiPlus;
    TeleportationSkillDict[skillId] = 0;
    enumerateTeleportTilesForUnitFuncMap.set(skillId,
        function (unit) {
            return this.__enumeratesSpacesWithinSpecificSpacesOfAnyAllyWithinSpecificSpaces(unit, 2, 1);
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
            }
        }
    );
}

// 大共謀4
{
    let setSkill = (skillId, statusValues = [0, 0, 0, 0]) => {
        canRallyForciblyFuncMap.set(skillId,
            function (unit) {
                return true;
            }
        );
        canRalliedForciblyFuncMap.set(skillId,
            function (unit) {
                return true;
            }
        );
        let func = function (supporterUnit, targetUnit) {
            this.__applyRuse(supporterUnit, targetUnit, unit => {
                unit.applyDebuffs(...statusValues.map(i => i * -6));
                unit.addStatusEffect(StatusEffectType.Discord);
                unit.addStatusEffect(StatusEffectType.Schism);
            });
        };
        applySkillsAfterRallyForSupporterFuncMap.set(skillId, func);
        applySkillsAfterRallyForTargetUnitFuncMap.set(skillId, func);
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                enemyUnit.addSpurs(...statusValues.map(i => i * -4));
            }
        );
    };
    // 速さ守備の大共謀4
    setSkill(PassiveB.SpdDefRuse4, [0, 1, 1, 0]);
    // 攻撃速さの大共謀4
    setSkill(PassiveB.AtkSpdRuse4, [1, 1, 0, 0]);
}

// 密偵忍者の手裏剣
{
    let skillId = Weapon.SpysShuriken;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
            }
        }
    );
    let func = function (supporterUnit, targetUnit) {
        supporterUnit.addStatusEffect(StatusEffectType.NullFollowUp);
        targetUnit.addStatusEffect(StatusEffectType.NullFollowUp);
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            if (unit.isInCrossOf(supporterUnit) ||
                unit.isInCrossOf(targetUnit)) {
                unit.addStatusEffect(StatusEffectType.Exposure);
            }
        }
    };
    applySkillsAfterRallyForSupporterFuncMap.set(skillId, func);
    applySkillsAfterRallyForTargetUnitFuncMap.set(skillId, func);
    applySupportSkillForSupporterFuncMap.set(skillId,
        function (supporterUnit, targetUnit, supportTile) {
            if (!supporterUnit.isOneTimeActionActivatedForWeapon) {
                supporterUnit.isActionDone = false;
                supporterUnit.isOneTimeActionActivatedForWeapon = true;
            }
        }
    );
    canRallyForciblyFuncMap.set(skillId,
        function (unit) {
            return true;
        }
    );
    canRalliedForciblyFuncMap.set(skillId,
        function (unit) {
            return true;
        }
    );
}

// 遠反・守魔の孤軍
{
    let skillId = PassiveA.DistantDRSolo;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                targetUnit.addDefResSpurs(5);
            }
        }
    );
}

// 漆黒の月光
{
    let skillId = Special.LightlessLuna;
    NormalAttackSpecialDict[skillId] = 0;
    initApplySpecialSkillEffectFuncMap.set(skillId,
        function (targetUnit, enemyUnit) {
            targetUnit.battleContext.specialSufferPercentage = 80;
        }
    );
    applyDamageReductionRatiosWhenCondSatisfiedFuncMap.set(skillId,
        function (atkUnit, defUnit) {
            if (defUnit.tmpSpecialCount === 0 ||
                atkUnit.tmpSpecialCount === 0 ||
                defUnit.battleContext.isSpecialActivated ||
                atkUnit.battleContext.isSpecialActivated) {
                defUnit.battleContext.damageReductionRatiosWhenCondSatisfied.push(0.4);
            }
        }
    );
}

// 将軍忍者の紅槍
{
    let skillId = Weapon.ScarletSpear;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                let amount = Math.min(Math.max(Math.trunc(enemyUnit.getAtkInPrecombat() * 0.25), 6), 12);
                targetUnit.atkSpur += amount;
                enemyUnit.atkSpur -= amount;
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    return 0.3;
                });
                targetUnit.battleContext.healedHpAfterCombat += 7;
            }
        }
    );
}

// あまいゆめ・神
{
    let skillId = Support.SweetDreamsPlus;
    refreshSupportSkillSet.add(skillId);
    applyRefreshFuncMap.set(skillId,
        function (skillOwnerUnit, targetUnit) {
            targetUnit.applyAllBuff(5);
            targetUnit.addStatusEffect(StatusEffectType.FollowUpAttackPlus);
            targetUnit.addStatusEffect(StatusEffectType.Hexblade);
            for (let unit of this.__findNearestEnemies(targetUnit, 5)) {
                unit.applyAllDebuff(-5);
            }
        }
    );
}

// 無惨・承
{
    let skillId = PassiveB.Atrocity2;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.restHpPercentage >= 40) {
                enemyUnit.addSpursWithoutRes(-4);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getAtk(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.25);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                    targetUnit.battleContext.applySkillEffectAfterCombatForUnitFuncs.push(
                        (targetUnit, enemyUnit) => {
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 3, true)) {
                                unit.applyAllDebuff(-6);
                                unit.addStatusEffect(StatusEffectType.Guard);
                                // この段階では上限を考慮しない（後から増減をまとめて確定する）
                                unit.specialCount++;
                            }
                        }
                    );
                });
            }
        }
    );
}

// 邪竜の救済
{
    let skillId = PassiveC.FellProtection;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAtkResSpurs(5);
                // 魔防が5以上高い時
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        if (targetUnit.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(targetUnit) + 5) {
                            targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                                return 0.3;
                            });
                            if (isNormalAttackSpecial(enemyUnit.special)) {
                                enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                            }
                        }
                    }
                );
            }
        }
    );

    applySkillEffectFromAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (targetUnit.distance(allyUnit) <= 2) {
                targetUnit.addAtkResSpurs(4);
                if (targetUnit.getEvalResInPrecombat() >= enemyUnit.getEvalResInPrecombat() + 5) {
                    targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                        return 0.3;
                    });
                    if (isNormalAttackSpecial(enemyUnit.special)) {
                        enemyUnit.battleContext.specialCountIncreaseBeforeFirstAttack += 1;
                    }
                }
            }
        }
    );
}

// 拍節
{
    let setTempo4Skill = function (skillId, func) {
        applySkillEffectForUnitFuncMap.set(skillId,
            function (targetUnit, enemyUnit, calcPotentialDamage) {
                func(enemyUnit);
                targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        enemyUnit.battleContext.reducesCooldownCount = false;
                        enemyUnit.battleContext.increaseCooldownCountForAttack = false;
                        enemyUnit.battleContext.increaseCooldownCountForDefense = false;
                    }
                );
                targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
            }
        );
    }

    // 攻撃魔防の拍節4
    setTempo4Skill(PassiveB.AtkResTempo4, unit => unit.addAtkResSpurs(-4));
    // 速さ守備の拍節4
    setTempo4Skill(PassiveB.SpdDefTempo4, unit => unit.addSpdDefSpurs(-4));
}

// オヴスキュリテ
{
    let skillId = Weapon.Obscurite;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                found = true;
                unit.reserveToApplyBuffs(6, 0, 0, 6);
                unit.reserveToAddStatusEffect(StatusEffectType.ResonantBlades);
                unit.reserveToAddStatusEffect(StatusEffectType.ResonantShield);
            }
            if (found) {
                skillOwner.reserveToApplyBuffs(6, 0, 0, 6);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.ResonantBlades);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.ResonantShield);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getRes(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
                targetUnit.battleContext.invalidateBuffs(true, false, false, true);
            }
        }
    );
}

// 陽光
{
    let skillId = Special.Flare;
    applySkillEffectsPerCombatFuncMap.set(skillId,
        function (targetUnit, enemyUnit, context) {
            if (targetUnit.battleContext.restHpPercentage >= 70) {
                let res = enemyUnit.getResInCombat(targetUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(res * 0.6));
            } else {
                let res = enemyUnit.getResInCombat(targetUnit);
                targetUnit.battleContext.addSpecialAddDamage(Math.trunc(res * 0.4));
                targetUnit.battleContext.maxHpRatioToHealBySpecialPerAttack += 0.3;
            }
        }
    );
}

// ヒータディア+
// ブラーディア+
{
    let func = function (targetUnit, enemyUnit, calcPotentialDamage) {
        if (enemyUnit.battleContext.initiatesCombat ||
            enemyUnit.battleContext.restHpPercentage >= 75) {
            targetUnit.atkSpur += 5;
            enemyUnit.atkSpur -= 5;
            targetUnit.battleContext.reducesCooldownCount = true;
        }
    };
    applySkillEffectForUnitFuncMap.set(Weapon.BlardeerPlus, func);
    applySkillEffectForUnitFuncMap.set(Weapon.HvitrdeerPlus, func);
}

// 響・攻撃の信義
{
    let skillId = PassiveX.AtkOathEcho;
    // ターン開始時スキル
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__isThereAllyIn2Spaces(skillOwner)) {
                skillOwner.reserveToApplyBuffs(6, 0, 0, 0);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
            }
        }
    );
}

// 速さの十字紋章
{
    let skillId = PassiveC.CrossSpurSpd;
    applySkillEffectFromAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (targetUnit.isInCrossOf(allyUnit)) {
                targetUnit.spdSpur += 5;
            }
        }
    );
}

// 疾風大地の舞い3
{
    let skillId = PassiveB.RockslideDance3;
    canActivateCantoFuncMap.set(skillId, function (unit) {
        return unit.battleContext.isRefreshActivated;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return 1;
    });
    applyRefreshFuncMap.set(skillId,
        function (skillOwnerUnit, targetUnit) {
            targetUnit.applyBuffs(0, 6, 6, 0);
            targetUnit.addStatusEffect(StatusEffectType.Dodge);
        }
    );
}

// やさしいひとのゆめ
{
    let skillId = Support.TenderDream;
    applyRefreshFuncMap.set(skillId,
        function (skillOwnerUnit, targetUnit) {
            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwnerUnit)) {
                if (this.__isInCross(unit, skillOwnerUnit) ||
                    this.__isInCross(unit, targetUnit)) {
                    unit.applyBuffs(4, 4, 4, 4);
                    unit.addStatusEffect(StatusEffectType.AirOrders);
                    unit.addStatusEffect(StatusEffectType.Canto1);
                }
            }
        }
    );
}

// 親愛の花
{
    let skillId = Weapon.FlowerOfCaring;
    applySkillEffectFromAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (targetUnit.isInCrossOf(allyUnit)) {
                targetUnit.addAtkSpdSpurs(5);
                targetUnit.battleContext.healedHpAfterCombat += 5;
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                targetUnit.battleContext.healedHpAfterCombat += 5;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    if (unit.isInCrossOf(targetUnit)) {
                        targetUnit.addAllSpur(4);
                        break;
                    }
                }
            }
        }
    );
}

// 響・鬼神の一撃
{
    let skillId = PassiveX.DeathBlowEcho;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                targetUnit.atkSpur += 4;
            }
        }
    );
}

// 怒涛・再起4
{
    let skillId = PassiveB.FlowRefresh4;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat) {
                enemyUnit.addSpdDefSpurs(-4);
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                targetUnit.battleContext.healedHpAfterCombat += 10;
            }
        }
    );
}

// こわいかこのゆめ
{
    let skillId = Support.HarrowingDream;
    applyRefreshFuncMap.set(skillId,
        function (skillOwnerUnit, targetUnit) {
            for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit)) {
                if (this.__isInCross(unit, skillOwnerUnit) ||
                    this.__isInCross(unit, targetUnit)) {
                    unit.applyDebuffs(-5, -5, -5, -5);
                    unit.addStatusEffect(StatusEffectType.Guard);
                    unit.addStatusEffect(StatusEffectType.Sabotage);
                }
            }
        }
    );
}

// 犠牲の花
{
    let skillId = Weapon.FlowerOfTribute;
    updateUnitSpurFromEnemyAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, enemyAllyUnit, calcPotentialDamage) {
            if (enemyAllyUnit.isInCrossWithOffset(targetUnit, 1)) {
                targetUnit.addSpdDefSpurs(-5);
                targetUnit.battleContext.damageAfterBeginningOfCombat += 5;
                let logMessage = `${enemyAllyUnit.nameWithGroup}のスキル(${skillId})により${targetUnit.getNameWithGroup()}に<span style="color: #ff0000">${5}</span>ダメージ`;
                this.__writeDamageCalcDebugLog(logMessage);
                this._damageCalc.writeSimpleLog(logMessage);
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                    if (isPrecombat) return;
                    let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                    atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.2);
                });
            }
        }
    );
}

// 近距離相互警戒
{
    let skillId = PassiveC.JointCloseGuard;
    applySkillEffectFromAlliesFuncMap.set(skillId,
        function (targetUnit, enemyUnit, allyUnit, calcPotentialDamage) {
            if (targetUnit.distance(allyUnit) <= 2) {
                if (enemyUnit.isMeleeWeaponType()) {
                    targetUnit.addDefResSpurs(4);
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (this.__isThereAllyIn2Spaces(targetUnit)) {
                if (enemyUnit.isMeleeWeaponType()) {
                    targetUnit.addDefResSpurs(4);
                }
            }
        }
    );
}

// 老練の槍
{
    let skillId = Weapon.WorldlyLance;
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (this.__isThereAllyIn2Spaces(skillOwner)) {
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                    unit.reserveToApplyBuffs(0, 0, 6, 6);
                    unit.reserveToAddStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat)
                }
            }
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                enemyUnit.addAtkDefSpurs(-6);
                let def = targetUnit.getDefInPrecombat();
                let amount = Math.trunc(def * 0.2);
                enemyUnit.addAtkDefSpurs(-amount);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.reducesCooldownCount = true;
            }
        }
    );
}

// 2種謀策3
{
    let generateFunc = debuffFunc => function (skillOwner) {
        /** @type {Unit[] | Generator<Unit>} */
        let units = this.enumerateUnitsInDifferentGroupOnMap(skillOwner);
        for (let unit of units) {
            if (skillOwner.isInCrossWithOffset(unit, 1) &&
                unit.statusEvalUnit.getEvalResInPrecombat() <
                skillOwner.statusEvalUnit.getEvalResInPrecombat() + 5) {
                debuffFunc(unit);
                unit.reserveToAddStatusEffect(StatusEffectType.Ploy);
                unit.reserveToAddStatusEffect(StatusEffectType.Exposure);
            }
        }
    };
    let setSkill = (skillId, debuffFunc) => {
        applySkillForBeginningOfTurnFuncMap.set(skillId, generateFunc(debuffFunc));
        applyEnemySkillForBeginningOfTurnFuncMap.set(skillId, generateFunc(debuffFunc));
    }

    // 攻撃魔防の謀策3
    setSkill(PassiveC.AtkSpdPloy3, u => u.reserveToApplyDebuffs(-7, -7, 0, 0));
    // 攻撃魔防の謀策3
    setSkill(PassiveC.AtkResPloy3, u => u.reserveToApplyDebuffs(-7, 0, 0, -7));
    // 守備魔防の謀策3
    setSkill(PassiveC.DefResPloy3, u => u.reserveToApplyDebuffs(0, 0, -7, -7));
}

// 魔女を超える者
{
    let skillId = PassiveA.BeyondWitchery;
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let amount = this.globalBattleContext.currentTurn === 1 ? 2 : 1;
            skillOwner.reserveToReduceSpecialCount(amount);
            skillOwner.reserveTakeDamage(amount);
        }
    );
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                (targetUnit, enemyUnit, calcPotentialDamage) => {
                    enemyUnit.battleContext.reducesCooldownCount = false;
                }
            );
        }
    );
}

// 魔器カリブルヌス
{
    let skillId = Weapon.ArcCaliburnus;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(5);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.increaseCooldownCountForBoth();
                targetUnit.battleContext.invalidateBuffs(true, false, false, true);
            }
        }
    );
}

// 農具+
{
    let skillId = Weapon.FarmersToolPlus;
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            let found = false;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                found = true;
                unit.reserveToApplyBuffs(6, 0, 6, 0);
            }
            if (found) {
                skillOwner.reserveToApplyBuffs(6, 0, 6, 0);
            }
        })
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.initiatesCombat ||
                this.__isThereAllyIn2Spaces(targetUnit)) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        // 周囲3マス以内の場合
                        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3);
                        let amounts = this.__getHighestBuffs(targetUnit, enemyUnit, units, true);
                        targetUnit.addSpurs(...amounts);
                    }
                );
            }
        }
    );
}

// 山猫の暗器
{
    let skillId = Weapon.WildcatDagger;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (targetUnit.battleContext.restHpPercentage >= 25) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedFuncs.push(
                    (targetUnit, enemyUnit, calcPotentialDamage) => {
                        this.__applyBuffAbsorption(targetUnit, enemyUnit);
                    }
                );
            }
            if (targetUnit.isWeaponSpecialRefined) {
                if (targetUnit.battleContext.initiatesCombat ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                        if (isPrecombat) return;
                        let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                        atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.1);
                    });
                }
            }
        }
    );
}

// 傭兵竜騎士の槍
{
    let skillId = Weapon.HyperionLance;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (enemyUnit.battleContext.initiatesCombat ||
                enemyUnit.battleContext.restHpPercentage >= 75) {
                targetUnit.addAllSpur(4);
                let amount = Math.trunc(targetUnit.getDefInPrecombat() * 0.1);
                enemyUnit.addSpursWithoutRes(-amount);
                targetUnit.battleContext.reducesCooldownCount = true;
            }
            if (targetUnit.isWeaponSpecialRefined) {
                targetUnit.addAllSpur(4);
                targetUnit.battleContext.followupAttackPriorityIncrement++;
                targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                    let ratio = 0.2;
                    if (!defUnit.isOneTimeActionActivatedForWeapon ||
                        !defUnit.isOneTimeActionActivatedForWeapon2) {
                        ratio = 0.4;
                    }
                    return ratio;
                });
            }
        }
    );
    setOnetimeActionActivatedFuncMap.set(skillId,
        function () {
            if (this.isWeaponSpecialRefined) {
                if (this.battleContext.initiatesCombat) {
                    this.isOneTimeActionActivatedForWeapon = true;
                } else {
                    this.isOneTimeActionActivatedForWeapon2 = true;
                }
            }
        }
    );
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            let ratio = 0.2;
            if (!defUnit.isOneTimeActionActivatedForWeapon ||
                !defUnit.isOneTimeActionActivatedForWeapon2) {
                ratio = 0.4;
            }
            defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
        }
    );
}

// ラクチェの流剣
{
    let skillId = Weapon.LarceisEdge;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat() ||
                    enemyUnit.battleContext.isRestHpFull) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidateAllBuffs();
                }
            } else {
                // <錬成効果>
                if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat() ||
                    enemyUnit.battleContext.restHpPercentage >= 75) {
                    targetUnit.addAllSpur(4);
                    targetUnit.battleContext.invalidateAllBuffs();
                    targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    );
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.calcFixedAddDamageFuncs.push((atkUnit, defUnit, isPrecombat) => {
                            let status = DamageCalculatorWrapper.__getSpd(atkUnit, defUnit, isPrecombat);
                            atkUnit.battleContext.additionalDamage += Math.trunc(status * 0.15);
                        });
                        targetUnit.battleContext.applySkillEffectAfterCombatForUnitFuncs.push(
                            (targetUnit, enemyUnit) => {
                                if (targetUnit.isSpecialCountMax) {
                                    targetUnit.reduceSpecialCount(1);
                                }
                            }
                        );
                    }
                }
            }
        }
    );
    applySkillForBeginningOfTurnFuncMap.set(skillId,
        function (skillOwner) {
            if (skillOwner.isWeaponSpecialRefined) {
                if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                    this.writeDebugLog(`${skillOwner.getNameWithGroup()}は始まりの鼓動効果(skillId: ${skillId})を発動`);
                    skillOwner.reserveToReduceSpecialCount(1);
                }
            }
        }
    );
}

// 白兎神の人参
{
    let skillId = Weapon.HakutoshinNoNinjin;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
            } else {
                // <錬成効果>
                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                if (targetUnit.battleContext.restHpPercentage >= 25) {
                    targetUnit.addAllSpur(5);
                    targetUnit.battleContext.applyInvalidationSkillEffectFuncs.push(
                        (targetUnit, enemyUnit, calcPotentialDamage) => {
                            enemyUnit.battleContext.reducesCooldownCount = false;
                        }
                    );
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (enemyUnit.battleContext.initiatesCombat ||
                        enemyUnit.battleContext.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(0.5);
                        targetUnit.battleContext.getDamageReductionRatioFuncs.push((atkUnit, defUnit) => {
                            return DamageCalculationUtility.getDodgeDamageReductionRatio(atkUnit, defUnit);
                        });
                    }
                }
            }
        }
    );
    evalSpdAddFuncMap.set(skillId, function (unit) {
        return unit.isWeaponSpecialRefined ? 7 : 0;
    })
    applyPrecombatDamageReductionRatioFuncMap.set(skillId,
        function (defUnit, atkUnit) {
            if (defUnit.isWeaponSpecialRefined) {
                if (atkUnit.battleContext.initiatesCombat ||
                    atkUnit.battleContext.restHpPercentage >= 75) {
                    let ratio = DamageCalculationUtility.getDodgeDamageReductionRatioForPrecombat(atkUnit, defUnit);
                    defUnit.battleContext.multDamageReductionRatioOfPrecombatSpecial(ratio);
                }
            }
        }
    );
}
// 幻影フェザー
{
    let skillId = Weapon.GeneiFeather;
    applySkillEffectForUnitFuncMap.set(skillId,
        function (targetUnit, enemyUnit, calcPotentialDamage) {
            if (!targetUnit.isWeaponRefined) {
                // <通常効果>
                if (targetUnit.battleContext.initiatesCombat &&
                    this.__isThereAnyAllyUnit(targetUnit, x => x.isActionDone)) {
                    targetUnit.addAtkSpdSpurs(6);
                    targetUnit.battleContext.isDesperationActivatable = true;
                }
            } else {
                // <錬成効果>
                if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                    targetUnit.addAtkSpdSpurs(6);
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                }
                if (targetUnit.battleContext.initiatesCombat) {
                    if (this.__isThereAnyAllyUnit(targetUnit, x => x.isActionDone)) {
                        targetUnit.battleContext.isDesperationActivatable = true;
                    }
                }
                if (targetUnit.isWeaponSpecialRefined) {
                    // <特殊錬成効果>
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.addAtkSpdSpurs(5);
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                        if (targetUnit.battleContext.initiatesCombat) {
                            if (this.__isThereAnyAllyUnit(targetUnit, x => x.isActionDone)) {
                                targetUnit.addAtkSpdSpurs(5);
                            }
                        }
                    }
                }
            }
        }
    );
    canActivateCantoFuncMap.set(skillId, function (unit) {
        return unit.isWeaponSpecialRefined;
    });
    calcMoveCountForCantoFuncMap.set(skillId, function () {
        return this.isWeaponSpecialRefined ? 2 : 0;
    })
}
