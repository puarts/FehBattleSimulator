

class PostCombatSkillHander {
    /**
     * @param  {UnitManager} unitManager
     * @param  {BattleMap} map
     * @param  {GlobalBattleContext} globalBattleContext
     * @param  {LoggerBase} logger
     */
    constructor(unitManager, map, globalBattleContext, logger) {
        this._unitManager = unitManager;
        this.map = map;
        this.globalBattleContext = globalBattleContext;
        this._logger = logger;
    }

    get unitManager() {
        return this._unitManager;
    }

    writeLogLine(log) {
        this._logger.writeLog(log);
    }
    writeDebugLogLine(log) {
        this._logger.writeDebugLog(log);
    }
    writeDebugLog(log) {
        this._logger.writeDebugLog(log);
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }

    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return this._unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }

    /**
     * @param {Unit} unit
     * @param {boolean} withTargetUnit
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
    }

    // 戦闘後スキル評価時にenumerateUnitsInTheSameGroupOnMapは護られているユニットを含まないのでそのユニットを含めてマップにいるユニットを列挙する
    enumerateUnitsInTheSameGroupOnMapIncludingSavedUnit(targetUnit, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsWithPredicator(x =>
            x.groupId === targetUnit.groupId
            && x.ownerType !== OwnerType.TrashBox // 護られるユニットは一時的にplacedTileが外れるのでゴミ箱に送られているかで判断
            && (withTargetUnit || x !== targetUnit)
        );
    }

    enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit) {
        return this._unitManager.enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit);
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateAllUnitsOnMap() {
        return this._unitManager.enumerateAllUnitsOnMap();
    }

    __findNearestAllies(targetUnit, distLimit = 100) {
        return this._unitManager.findNearestAllies(targetUnit, distLimit);
    }

    __getStatusEvalUnit(unit) {
        return unit.snapshot != null ? unit.snapshot : unit;
    }
    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    /// 戦闘結果の評価や戦闘後発動のスキルなどを適用します。
    /**
     * @param  {Unit} atkUnit
     * @param  {Unit} defUnit
     * @param  {DamageCalcResult} result
     */
    applyPostCombatProcess(atkUnit, defUnit, result) {
        // 戦闘後のダメージ、回復の合計を反映させないといけないので予約HPとして計算
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.initReservedHp();
            unit.initReservedStatusEffects();
        }

        // 最初の戦闘のみで発動する状態効果は、状態が付与されていない戦闘も最初の戦闘にカウントするので
        // 強制的にtrueにする
        atkUnit.setOnetimeActionActivated();
        defUnit.setOnetimeActionActivated();

        // 戦闘後発動のスキル効果
        if (atkUnit.isAlive) {
            if (result.atkUnit_actualTotalAttackCount > 0) {
                this.writeDebugLogLine(`${atkUnit.getNameWithGroup()}の戦闘後発動のスキル効果を評価`);
                this.__applyOverlappableSkillEffectFromAttackerAfterCombat(atkUnit, defUnit);
                this.__applyAttackSkillEffectAfterCombat(atkUnit, defUnit);
            }

            this.__applySkillEffectAfterCombatForUnit(atkUnit, defUnit);
        }

        if (defUnit.isAlive) {
            if (result.defUnit_actualTotalAttackCount > 0) {
                this.writeDebugLogLine(`${defUnit.getNameWithGroup()}の戦闘後発動のスキル効果を評価`);
                this.__applyAttackSkillEffectForDefenseAfterCombat(defUnit, atkUnit);
                this.__applyAttackSkillEffectAfterCombat(defUnit, atkUnit);
            }
            this.__applySkillEffectAfterCombatForUnit(defUnit, atkUnit);
        }

        // 死んでも発動するスキル効果
        this.#applySkillEffectsAfterCombatNeverthelessDeadForUnits(atkUnit, defUnit, result);

        // BattleContextに記録された回復・ダメージの予約
        for (let unit of this.enumerateAllUnitsOnMap()) {
            this.__reserveHealOrDamageAfterCombatForUnit(unit);
        }

        this.#applyReservedEffects();

        // 回復・ダメージ適用後のスキル効果
        this.#applySkillEffectsAfterHealOrDamage(atkUnit, defUnit);
        this.#applySkillEffectsAfterHealOrDamage(defUnit, atkUnit);
        this.#applyReservedEffects();

        this.#applyPostCombatAllySkills(atkUnit);
        this.#applyPostCombatAllySkills(defUnit);
        this.#applyReservedEffects();
    }

    #applySkillEffectsAfterCombatNeverthelessDeadForUnits(atkUnit, defUnit, result) {
        if (result.atkUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit, result.atkUnit_actualTotalAttackCount);

        if (result.defUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit, result.defUnit_actualTotalAttackCount);
    }

    #applyReservedEffects() {
        // 奥義カウントやHP変動の加減値をここで確定
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.modifySpecialCount();
            if (!unit.isDead) {
                let [hp, damage, heal, reducedHeal] = unit.applyReservedHp(true);
                if (damage !== 0 || heal !== 0 || reducedHeal !== 0) {
                    this.writeDebugLogLine(`${unit.nameWithGroup}の戦闘後HP hp: ${hp}, damage: ${damage}, heal: ${heal}, reduced: ${reducedHeal}`);
                }
                unit.applyReservedState(false);
            }
        }

        // 戦闘後のタイミング終了
        // TODO: このタイミングで良いか検証する(アニメーションを見る限り回復・ダメージの後に天脈付与)
        // 切り込みなどの前に天脈が付与(アニメーションではほぼ同時)
        g_appData.map.applyReservedDivineVein();
    }

    #applySkillEffectsAfterHealOrDamage(targetUnit, enemyUnit) {
        let env = new AfterCombatEnv(this, targetUnit, enemyUnit);
        env.setName('戦闘後(HP確定後)').setLogLevel(getSkillLogLevel());
        AFTER_COMBAT_AFTER_HEAL_OR_DAMAGE_HOOKS.evaluateWithUnit(targetUnit, env);
    }

    __applyOverlappableSkillEffectFromAttackerAfterCombat(atkUnit, attackTargetUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Simuberin:
                    if (!atkUnit.isWeaponRefined) {
                        this.__applyHoneSkill(atkUnit, x => true, x => x.reserveToApplyBuffs(4, 0, 0, 0));
                    }
                    break;
                case Weapon.KuraineNoYumi:
                case Weapon.KuraineNoYumiPlus:
                case Weapon.YamiNoBreath:
                case Weapon.YamiNoBreathPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, false)) {
                        unit.reserveToApplyDebuffs(-5, -5, 0, 0);
                    }
                    break;
                case Weapon.FirstBite:
                case Weapon.FirstBitePlus:
                case Weapon.KyupittoNoYa:
                case Weapon.KyupittoNoYaPlus:
                case Weapon.SeinaruBuke:
                case Weapon.SeinaruBukePlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 2, false)) {
                        unit.reserveToApplyBuffs(0, 0, 2, 2);
                    }
                    break;
                case Weapon.NinjinNoYari:
                case Weapon.NinjinNoYariPlus:
                case Weapon.NinjinNoOno:
                case Weapon.NinjinNoOnoPlus:
                case Weapon.AoNoTamago:
                case Weapon.AoNoTamagoPlus:
                case Weapon.MidoriNoTamago:
                case Weapon.MidoriNoTamagoPlus:
                    atkUnit.reserveHeal(4);
                    break;
                case Weapon.FalcionEchoes:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (this.__getStatusEvalUnit(atkUnit).isRestHpFull) {
                            atkUnit.reserveTakeDamage(5);
                        }
                    }
                    break;
                case PassiveB.Shishirenzan:
                    if (this.__getStatusEvalUnit(atkUnit).isRestHpFull) {
                        atkUnit.reserveTakeDamage(1);
                    }
                    break;
                case Weapon.ButosaiNoGakuhu:
                case Weapon.ButosaiNoGakuhuPlus:
                case Weapon.ButosaiNoSensu:
                case Weapon.ButosaiNoSensuPlus:
                case Weapon.ButosaiNoWa:
                case Weapon.ButosaiNoWaPlus:
                case PassiveC.SeiNoIbuki3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 1, false)) {
                        unit.reserveHeal(7);
                    }
                    break;
                case Weapon.Ora:
                    if (!atkUnit.isWeaponRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 1, false)) {
                            unit.reserveHeal(5);
                        }
                    }
                    break;
                case Weapon.SnipersBow:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveTakeDamage(7);
                        unit.reserveToApplyDebuffs(-7, -7, 0, 0);
                    }
                    break;
                case PassiveC.SavageBlow1:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は死の吐息により3ダメージ");
                        unit.reserveTakeDamage(3);
                    }
                    break;
                case PassiveC.SavageBlow2:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は死の吐息により5ダメージ");
                        unit.reserveTakeDamage(5);
                    }
                    break;
                case PassiveC.SavageBlow3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は死の吐息により7ダメージ");
                        unit.reserveTakeDamage(7);
                    }
                    break;
                case Weapon.Pain:
                case PassiveB.PoisonStrike3:
                    attackTargetUnit.reserveTakeDamage(10);
                    break;

            }
        }
    }


    __applyAttackSkillEffectAfterCombat(attackUnit, attackTargetUnit) {
        for (let func of attackUnit.battleContext.applyAttackSkillEffectAfterCombatFuncs) {
            func(attackUnit, attackTargetUnit);
        }
        for (let skillId of attackUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applyAttackSkillEffectAfterCombatFuncMap);
            func?.call(this, attackUnit, attackTargetUnit);
            switch (skillId) {
                case Weapon.KyupidNoYaPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, false)) {
                        unit.reserveToApplyBuffs(0, 0, 2, 2);
                    }
                    break;
                case Weapon.SpendthriftBowPlus:
                    attackUnit.reserveToIncreaseSpecialCount(2);
                    break;
                case Weapon.Rifia:
                    if (!attackUnit.isWeaponRefined) {
                        if (attackUnit.battleContext.restHpPercentage >= 50) {
                            attackUnit.reserveTakeDamage(4);
                        }
                    }
                    break;
                case Weapon.Death:
                    attackUnit.reserveTakeDamage(4);
                    break;
                case Weapon.SakanaWoTsuitaMori:
                case Weapon.SakanaWoTsuitaMoriPlus:
                case Weapon.SuikaWariNoKonbo:
                case Weapon.SuikaWariNoKonboPlus:
                case Weapon.KorigashiNoYumi:
                case Weapon.KorigashiNoYumiPlus:
                case Weapon.Kaigara:
                case Weapon.KaigaraPlus:
                    if (this.__getStatusEvalUnit(attackUnit).isRestHpFull) {
                        attackUnit.reserveTakeDamage(2);
                    }
                    break;
                case PassiveA.HashinDanryuKen:
                    attackUnit.reserveTakeDamage(7);
                    break;
                case Weapon.Ragnarok:
                    if (attackUnit.isWeaponSpecialRefined) {
                        attackUnit.reserveTakeDamage(5);
                    }
                    else {
                        if (this.__getStatusEvalUnit(attackUnit).isRestHpFull) {
                            attackUnit.reserveTakeDamage(5);
                        }
                    }
                    break;
                case Weapon.HokenSophia:
                    if (!attackUnit.isWeaponRefined) {
                        if (this.__getStatusEvalUnit(attackUnit).isRestHpFull) {
                            attackUnit.reserveTakeDamage(4);
                        }
                    }
                    else {
                        attackUnit.reserveTakeDamage(4);
                    }
                    break;
            }
        }
    }

    /**
     * @param  {Unit} targetUnit
     * @param  {Unit} enemyUnit
     */
    __applySkillEffectAfterCombatForUnit(targetUnit, enemyUnit) {
        for (let func of targetUnit.battleContext.applySkillEffectAfterCombatForUnitFuncs) {
            func(targetUnit, enemyUnit);
        }
        for (let skillId of enemyUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveS.GoeiNoGuzo:
                case PassiveS.TozokuNoGuzoRakurai:
                case PassiveS.TozokuNoGuzoKobu:
                case PassiveS.TozokuNoGuzoKogun:
                case PassiveS.TozokuNoGuzoKusuri:
                case PassiveS.TozokuNoGuzoOugi:
                case PassiveS.TozokuNoGuzoOdori:
                    if (!enemyUnit.isAlive) {
                        this.writeDebugLogLine(`${enemyUnit.passiveSInfo.name}発動、${targetUnit.getNameWithGroup()}のHP10回復、奥義カウント+1`);
                        targetUnit.reserveHeal(10);
                        targetUnit.reserveToIncreaseSpecialCount(1);
                    }
                    break;
            }
        }
        let env = new AfterCombatEnv(this, targetUnit, enemyUnit);
        env.setName('戦闘後').setLogLevel(getSkillLogLevel());
        AFTER_COMBAT_HOOKS.evaluateWithUnit(targetUnit, env);
        for (let skillId of targetUnit.enumerateSkills()) {
            getSkillFunc(skillId, applySkillEffectAfterCombatForUnitFuncMap)?.call(this, targetUnit, enemyUnit);
            switch (skillId) {
                case Weapon.FathersSonAxe:
                    if (targetUnit.isWeaponSpecialRefined && targetUnit.battleContext.weaponSkillCondSatisfied) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.VassalSaintSteel:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (targetUnit.isSpecialCountMax) {
                            targetUnit.reduceSpecialCount(1);
                        }
                    }
                    break;
                case PassiveB.FruitOfLife:
                    if (targetUnit.battleContext.restHpPercentage >= 25 &&
                        targetUnit.battleContext.passiveBSkillCondSatisfied) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 1, true)) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                    break;
                case Weapon.LoneWolf:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        if (targetUnit.isSpecialCountMax) {
                            targetUnit.reserveToReduceSpecialCount(2);
                        } else if (Number(targetUnit.specialCount) === Number(targetUnit.maxSpecialCount) - 1) {
                            targetUnit.reserveToReduceSpecialCount(1);
                        }
                    }
                    break;
                case Weapon.FlowerOfJoy:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            let found = false;
                            for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                                if (unit.posX === targetUnit.posX ||
                                    unit.posY === targetUnit.posY) {
                                    found = true;
                                    unit.reserveHeal(7);
                                }
                            }
                            if (found) {
                                targetUnit.reserveHeal(7);
                            }
                        }
                    }
                    break;
                case Weapon.BrilliantStarlight:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case PassiveA.Nightmare:
                    if (enemyUnit.battleContext.initiatesCombat) {
                        let units = [];
                        let minDistance = Number.MAX_SAFE_INTEGER;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 4)) {
                            if (unit.isActionDone) continue;
                            let distance = enemyUnit.distance(unit);
                            if (distance === minDistance) {
                                units.push(unit);
                            } else if (distance < minDistance) {
                                units = [unit];
                                minDistance = distance;
                            }
                        }
                        units.map(unit => unit.endActionBySkillEffect());
                    }
                    break;
                case PassiveC.TimesPulse4:
                    if (targetUnit.isSpecialCountMax) {
                        targetUnit.reserveToReduceSpecialCount(1);
                    }
                    break;
                case Weapon.MagetsuNoSaiki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            targetUnit.reserveHeal(7);
                        }
                    }
                    break;
                case Weapon.ArcaneGrima:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.FirelightLance:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 4, true)) {
                            unit.reduceSpecialCount(1);
                        }
                    }
                    break;
                case PassiveB.AtkSpdBulwark3:
                case PassiveB.AtkDefBulwark3:
                case PassiveB.SpdDefBulwark3:
                case PassiveB.SpdResBulwark3:
                    targetUnit.reserveHeal(7);
                    break;
                case Weapon.EbonBolverk:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.MorphFimbulvetr:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        for (let unit of this.__findNearestAllies(targetUnit)) {
                            unit.reserveTakeDamage(15);
                        }
                    }
                    break;
                case Weapon.WildTigerFang:
                    if (targetUnit.isTransformed) {
                        targetUnit.reserveTakeDamage(5);
                    }
                    break;
                case PassiveB.TrueDragonWall: {
                    let found = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMapIncludingSavedUnit(targetUnit)) {
                        if (isWeaponTypeBreathOrBeast(unit.weaponType)) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                }
                case Weapon.LandsSword:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.AscendingBlade:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.reserveToReduceSpecialCount(1);
                    }
                    break;
                case Weapon.PastelPoleaxe:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                            unit.reserveHeal(7);
                        }
                    }
                    break;
                case PassiveB.FaithfulLoyalty:
                    targetUnit.reserveToAddStatusEffect(StatusEffectType.Vantage);
                    break;
                case Weapon.GousouJikumunto:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.battleContext.restHpPercentage >= 75 || self.__isSolo(targetUnit)) {
                            targetUnit.reserveHeal(7);
                        }
                    }
                    break;
                case Weapon.Rifia:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                                unit.reserveHeal(7);
                            }
                        }
                    }
                    break;
                case Weapon.StaffOfTributePlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                        unit.reserveHeal(7);
                    }
                    break;
                case Weapon.InviolableAxe:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                                unit.reserveHeal(7);
                            }
                        }
                    }
                    break;
                case Weapon.NiflsBite:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.DuskDragonstone:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                            targetUnit.reserveHeal(7);
                        }
                    }
                    break;
                case PassiveB.SolarBrace2:
                    targetUnit.reserveHeal(10);
                    break;
                case PassiveB.FlowRefresh3:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.reserveHeal(10);
                    }
                    break;
                case PassiveB.ArmoredWall:
                    if (targetUnit.battleContext.restHpPercentage >= 25) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.Ivarudhi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.restHpPercentage >= 75) {
                            targetUnit.reserveHeal(7);
                        }
                    }
                    break;
                case PassiveB.FallenStar:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.reserveToAddStatusEffect(StatusEffectType.FallenStar);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 1, true)) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                    break;
                case Weapon.EffiesLance:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case Weapon.TomeOfFavors:
                    if (!isWeaponTypeBeast(enemyUnit.weaponType)) {
                        targetUnit.reserveHeal(7);
                    }
                    break;
                case Weapon.OukeNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.restHpPercentage >= 25) {
                            targetUnit.reserveHeal(7);
                            targetUnit.reserveToReduceSpecialCount(1);
                        }
                    }
                    break;
                case Weapon.RauarRabbitPlus:
                case Weapon.BlarRabbitPlus:
                case Weapon.GronnRabbitPlus:
                case Weapon.ConchBouquetPlus:
                case Weapon.MelonFloatPlus:
                case Weapon.HiddenThornsPlus:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.reserveHeal(7);
                        targetUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case PassiveB.SealAtk1: enemyUnit.reserveToApplyAtkDebuff(-3); break;
                case PassiveB.SealAtk2: enemyUnit.reserveToApplyAtkDebuff(-5); break;
                case PassiveB.SealAtk3: enemyUnit.reserveToApplyAtkDebuff(-7); break;
                case PassiveB.SealAtk4: enemyUnit.reserveToApplyAtkDebuff(-7); break;
                case PassiveB.SealSpd1: enemyUnit.reserveToApplySpdDebuff(-3); break;
                case PassiveB.SealSpd2: enemyUnit.reserveToApplySpdDebuff(-5); break;
                case PassiveB.SealSpd3: enemyUnit.reserveToApplySpdDebuff(-7); break;
                case PassiveB.SealSpd4: enemyUnit.reserveToApplySpdDebuff(-7); break;
                case PassiveB.SealDef1: enemyUnit.reserveToApplyDefDebuff(-3); break;
                case PassiveB.SealDef2: enemyUnit.reserveToApplyDefDebuff(-5); break;
                case PassiveB.SealDef3: enemyUnit.reserveToApplyDefDebuff(-7); break;
                case PassiveB.SealDef4: enemyUnit.reserveToApplyDefDebuff(-7); break;
                case PassiveB.SealRes1: enemyUnit.reserveToApplyResDebuff(-3); break;
                case PassiveB.SealRes2: enemyUnit.reserveToApplyResDebuff(-5); break;
                case PassiveB.SealRes3: enemyUnit.reserveToApplyResDebuff(-7); break;
                case PassiveB.SealRes4: enemyUnit.reserveToApplyResDebuff(-7); break;
                case PassiveB.SealAtkSpd1:
                    enemyUnit.reserveToApplyAtkDebuff(-3);
                    enemyUnit.reserveToApplySpdDebuff(-3);
                    break;
                case PassiveB.SealAtkDef1:
                    enemyUnit.reserveToApplyAtkDebuff(-3);
                    enemyUnit.reserveToApplyDefDebuff(-3);
                    break;
                case PassiveB.SealDefRes1:
                    enemyUnit.reserveToApplyDefDebuff(-3);
                    enemyUnit.reserveToApplyResDebuff(-3);
                    break;
                case PassiveB.SealSpdDef1:
                    enemyUnit.reserveToApplySpdDebuff(-3);
                    enemyUnit.reserveToApplyDefDebuff(-3);
                    break;
                case PassiveB.SealSpdRes1:
                    enemyUnit.reserveToApplySpdDebuff(-3);
                    enemyUnit.reserveToApplyResDebuff(-3);
                    break;
                case PassiveB.SealAtkSpd2:
                    enemyUnit.reserveToApplyAtkDebuff(-5);
                    enemyUnit.reserveToApplySpdDebuff(-5);
                    break;
                case PassiveB.SealAtkDef2:
                    enemyUnit.reserveToApplyAtkDebuff(-5);
                    enemyUnit.reserveToApplyDefDebuff(-5);
                    break;
                case PassiveB.SealAtkRes2:
                    enemyUnit.reserveToApplyAtkDebuff(-5);
                    enemyUnit.reserveToApplyResDebuff(-5);
                    break;
                case PassiveB.SealDefRes2:
                    enemyUnit.reserveToApplyDefDebuff(-5);
                    enemyUnit.reserveToApplyResDebuff(-5);
                    break;
                case PassiveB.SealSpdDef2:
                    enemyUnit.reserveToApplySpdDebuff(-5);
                    enemyUnit.reserveToApplyDefDebuff(-5);
                    break;
                case PassiveB.SealSpdRes2:
                    enemyUnit.reserveToApplySpdDebuff(-5);
                    enemyUnit.reserveToApplyResDebuff(-5);
                    break;
                case PassiveB.SeimeiNoGofu3:
                    targetUnit.reserveHeal(6);
                    break;
                case PassiveB.MysticBoost4:
                    targetUnit.reserveHeal(10);
                    break;
                case Weapon.WaryRabbitFang:
                    if (targetUnit.battleContext.weaponSkillCondSatisfied) {
                        if (targetUnit.hpPercentage <= 90) {
                            targetUnit.reserveToReduceSpecialCount(2);
                        }
                    }
                    break;
                case Weapon.TaguelChildFang: {
                    let percentage = targetUnit.isWeaponRefined ? 90 : 75;
                    if (targetUnit.hpPercentage <= percentage) {
                        targetUnit.reserveToReduceSpecialCount(2);
                    }
                }
                    break;
                case Weapon.MasyouNoYari:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.reserveTakeDamage(6);
                    } else {
                        targetUnit.reserveTakeDamage(4);
                    }
                    break;
                case Weapon.DevilAxe:
                    targetUnit.reserveTakeDamage(4);
                    break;
                case Weapon.BatoruNoGofu:
                case Weapon.HinataNoMoutou:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.reserveTakeDamage(6);
                    }
                    break;
                case PassiveA.Fury1:
                    targetUnit.reserveTakeDamage(2);
                    break;
                case PassiveA.Fury2:
                    targetUnit.reserveTakeDamage(4);
                    break;
                case Weapon.FurasukoPlus:
                case Weapon.KabochaNoGyotoPlus:
                case Weapon.BikkuriBakoPlus:
                case Weapon.RosokuNoYumiPlus:
                case Weapon.Mistoruthin:
                case PassiveA.Fury3:
                    targetUnit.reserveTakeDamage(6);
                    break;
                case PassiveA.Fury4:
                    targetUnit.reserveTakeDamage(8);
                    break;
                case PassiveA.AtkSpdPush3:
                case PassiveA.AtkDefPush3:
                case PassiveA.AtkResPush3:
                    this.writeDebugLogLine("渾身3を評価: 戦闘前のHP=" + targetUnit.battleContext.hpBeforeCombat);
                    if (targetUnit.battleContext.hpBeforeCombat === targetUnit.maxHpWithSkills) {
                        this.writeLogLine("渾身3による1ダメージ");
                        targetUnit.reserveTakeDamage(1);
                    }
                    break;
                case PassiveA.DistantStorm:
                case PassiveA.DistantPressure:
                case PassiveA.CloseSalvo:
                case PassiveA.AtkSpdPush4:
                case PassiveA.AtkResPush4:
                case PassiveA.AtkDefPush4:
                    this.writeDebugLogLine(`${targetUnit.passiveAInfo.name}を評価: 戦闘前のHP=` + targetUnit.battleContext.hpBeforeCombat);
                    if (targetUnit.battleContext.hpBeforeCombat >= Math.floor(targetUnit.maxHpWithSkills * 0.25)) {
                        this.writeLogLine(`${targetUnit.passiveAInfo.name}による5ダメージ`);
                        targetUnit.reserveTakeDamage(5);
                    }
                    break;
                case PassiveB.DeadlyBalancePlus:
                case PassiveB.OgiNoRasen3:
                case PassiveB.SpecialSpiral4:
                case Weapon.MakenMistoruthin:
                    if (targetUnit.battleContext.hasSpecialActivated) {
                        targetUnit.reserveToReduceSpecialCount(2);
                    }
                    break;
                case PassiveC.FatalSmoke3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.DeepWounds);
                    }
                    break;
                case PassiveC.PanicSmoke3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case PassiveC.KodoNoGenen3:
                    this.writeDebugLogLine(targetUnit.getNameWithGroup() + "の鼓動の幻煙3発動");
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                        unit.reserveToIncreaseSpecialCount(1);
                    }
                    break;
                case PassiveB.Atrocity:
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        this.writeDebugLogLine(targetUnit.getNameWithGroup() + "の無惨発動");
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                            this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                            unit.reserveToIncreaseSpecialCount(1);
                            unit.reserveToApplyAllDebuff(-5);
                        }
                    }
                    break;
                // 紫煙
                case PassiveC.AtkSmoke1: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyAtkDebuff(-3)); break;
                case PassiveC.AtkSmoke2: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyAtkDebuff(-5)); break;
                case PassiveC.AtkSmoke3: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyAtkDebuff(-7)); break;
                case PassiveC.SpdSmoke1: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplySpdDebuff(-3)); break;
                case PassiveC.SpdSmoke2: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplySpdDebuff(-5)); break;
                case PassiveC.SpdSmoke3: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplySpdDebuff(-7)); break;
                case PassiveC.DefSmoke1: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyDefDebuff(-3)); break;
                case PassiveC.DefSmoke2: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyDefDebuff(-5)); break;
                case PassiveC.DefSmoke3: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyDefDebuff(-7)); break;
                case PassiveC.ResSmoke1: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyResDebuff(-3)); break;
                case PassiveC.ResSmoke2: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyResDebuff(-5)); break;
                case PassiveC.ResSmoke3: this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyResDebuff(-7)); break;
                // SP300紫煙
                case PassiveC.DefResSmoke3:
                    this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyDebuffs(0, 0, -7, -7), true);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                        unit.reserveToApplyAtkBuff(6);
                    }
                    targetUnit.reserveToAddStatusEffect(StatusEffectType.Pathfinder);
                    break;
                case PassiveC.AtkSmoke4:
                    this.__applySmokeSkill(enemyUnit, x => x.reserveToApplyAtkDebuff(-7), true);
                    targetUnit.reserveToApplyDefBuff(6);
                    targetUnit.reserveToApplyResBuff(6);
                    targetUnit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                    break;
                case PassiveC.SpdSmoke4:
                    this.__applySmokeSkill(enemyUnit, x => x.reserveToApplySpdDebuff(-7), true);
                    targetUnit.reserveToApplySpdBuff(6);
                    targetUnit.reserveToAddStatusEffect(StatusEffectType.Dodge);
                    break;
            }
        }
    }

    /**
     * @param  {Unit} targetUnit
     */
    __reserveHealOrDamageAfterCombatForUnit(targetUnit) {
        if (targetUnit.isAlive) {
            targetUnit.reserveHeal(targetUnit.battleContext.healedHpAfterCombat);
            targetUnit.reserveTakeDamage(targetUnit.battleContext.damageAfterCombat);
        }
    }

    __applyAttackSkillEffectForDefenseAfterCombat(defUnit, atkUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Kurimuhirudo:
                    if (!defUnit.isWeaponRefined) {
                        if (atkUnit.isRangedWeaponType()) {
                            for (let unit of this.__findNearestAllies(defUnit, 2)) {
                                unit.reserveTakeDamage(20);
                            }
                        }
                    } else {
                        for (let unit of this.__findNearestAllies(defUnit, 3)) {
                            unit.reserveTakeDamage(20);
                        }
                    }
                    break;
            }
        }
    }

    __applyBlackEffect(targetUnit, enemyUnit) {
        let placedTile = enemyUnit.placedTile;
        let tx = targetUnit.posX;
        let ty = targetUnit.posY;
        let ex = placedTile.posX;
        let ey = placedTile.posY;
        if (ty === ey + 1) {
            for (let tile of this.map.enumerateTiles()) {
                if (tile.isInRange(ex - 2, ex + 2, ey - 1, ey)) {
                    tile.reserveDivineVein(DivineVeinType.Flame, targetUnit.groupId);
                }
            }
        } else if (ty === ey - 1) {
            for (let tile of this.map.enumerateTiles()) {
                if (tile.isInRange(ex - 2, ex + 2, ey, ey + 1)) {
                    tile.reserveDivineVein(DivineVeinType.Flame, targetUnit.groupId);
                }
            }
        } else if (tx === ex + 1) {
            for (let tile of this.map.enumerateTiles()) {
                if (tile.isInRange(ex - 1, ex, ey - 2, ey + 2)) {
                    tile.reserveDivineVein(DivineVeinType.Flame, targetUnit.groupId);
                }
            }
        } else if (tx === ex - 1) {
            for (let tile of this.map.enumerateTiles()) {
                if (tile.isInRange(ex, ex + 1, ey - 2, ey + 2)) {
                    tile.reserveDivineVein(DivineVeinType.Flame, targetUnit.groupId);
                }
            }
        }
    }

    __applyFlaredSkillEffect(targetUnit, enemyUnit) {
        let placedTile = enemyUnit.placedTile;
        // キャラの位置関係によって天脈対象のタイルが異なる
        let divineVein = DivineVeinType.Flame;
        if (targetUnit.posX === enemyUnit.posX) {
            // x軸が等しい時
            for (let tile of this.map.enumerateTiles()) {
                if (tile.posY === placedTile.posY &&
                    Math.abs(tile.posX - placedTile.posX) <= 2) {
                    tile.reserveDivineVein(divineVein, targetUnit.groupId);
                }
            }
        } else if (targetUnit.posY === enemyUnit.posY) {
            // y軸が等しい時
            for (let tile of this.map.enumerateTiles()) {
                if (tile.posX === placedTile.posX &&
                    Math.abs(tile.posY - placedTile.posY) <= 2) {
                    tile.reserveDivineVein(divineVein, targetUnit.groupId);
                }
            }
        } else if (
            targetUnit.posX > enemyUnit.posX && targetUnit.posY > enemyUnit.posY ||
            targetUnit.posX < enemyUnit.posX && targetUnit.posY < enemyUnit.posY
        ) {
            // 第1, 3象限
            for (let tile of this.map.enumerateTiles()) {
                if (
                    (tile.posX === placedTile.posX && tile.posY === placedTile.posY) ||
                    (tile.posX === placedTile.posX + 1 && tile.posY === placedTile.posY - 1) ||
                    (tile.posX === placedTile.posX + 2 && tile.posY === placedTile.posY - 2) ||
                    (tile.posX === placedTile.posX - 1 && tile.posY === placedTile.posY + 1) ||
                    (tile.posX === placedTile.posX - 2 && tile.posY === placedTile.posY + 2)
                ) {
                    tile.reserveDivineVein(divineVein, targetUnit.groupId);
                }
            }
        } else if (
            targetUnit.posX > enemyUnit.posX && targetUnit.posY < enemyUnit.posY ||
            targetUnit.posX < enemyUnit.posX && targetUnit.posY > enemyUnit.posY
        ) {
            // 第2, 4象限
            for (let tile of this.map.enumerateTiles()) {
                if (
                    (tile.posX === placedTile.posX && tile.posY === placedTile.posY) ||
                    (tile.posX === placedTile.posX + 1 && tile.posY === placedTile.posY + 1) ||
                    (tile.posX === placedTile.posX + 2 && tile.posY === placedTile.posY + 2) ||
                    (tile.posX === placedTile.posX - 1 && tile.posY === placedTile.posY - 1) ||
                    (tile.posX === placedTile.posX - 2 && tile.posY === placedTile.posY - 2)
                ) {
                    tile.reserveDivineVein(divineVein, targetUnit.groupId);
                }
            }
        }
    }

    __applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit) {
        this.#applyEssenceDrain(attackUnit, attackTargetUnit);
        for (let func of attackUnit.battleContext.applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncs) {
            func(attackUnit, attackTargetUnit);
        }

        let env = new AfterCombatEnv(this, attackUnit, attackTargetUnit);
        env.setName('戦闘後(攻撃していれば)').setLogLevel(getSkillLogLevel());
        AFTER_COMBAT_IF_UNIT_ATTACKED_HOOKS.evaluateWithUnit(attackUnit, env);

        for (let skillId of attackUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applyAttackSkillEffectAfterCombatNeverthelessDeadForUnitFuncMap);
            func?.call(this, attackUnit, attackTargetUnit);
            this.#applyAnAttackSkillEffectAfterCombatNeverthelessDeadForUnit(skillId, attackUnit, attackTargetUnit);
        }
        this.#applyDaggerSkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit);
    }

    /**
     * @param {Unit} attackUnit
     * @param {Unit} attackTargetUnit
     */
    #applyEssenceDrain(attackUnit, attackTargetUnit) {
        if (!attackUnit.hasStatusEffect(StatusEffectType.EssenceDrain)) {
            return;
        }
        // 【エーギル奪取】
        // 戦闘中に攻撃していれば、
        // 戦闘後に自分と【エーギル奪取】が付与されている味方に、
        // 戦闘相手とその周囲2マス以内の敵が受けている【有利な状態】を付与（1ターン）し、
        // 戦闘相手とその周囲2マス以内の敵の【有利な状態】を解除
        // （付与、解除ともに、同じタイミングに付与された有利な状態は含まない）
        let enemies = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true);
        /** @type {Unit[]} */
        let allyArray = Array.from(this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true));
        let targetAllyArray = allyArray.filter(u => u.hasStatusEffect(StatusEffectType.EssenceDrain));
        this.writeDebugLog("エーギル奪取の効果を発動");
        stealBonusEffects(Array.from(enemies), attackUnit, targetAllyArray, this);
        // 戦闘で敵を撃破していれば、
        // 戦闘後に自分と【エーギル奪取】が付与されている味方は10回復
        // (敵を撃破しているなら1回は攻撃しているはず)
        // TODO: 攻撃しなくても敵を撃破できる手段ができた場合に以下の処理を修正する(1回は攻撃しているロジックの外に出す)
        if (attackTargetUnit.isDead) {
            for (let ally of targetAllyArray) {
                ally.reserveHeal(10);
            }
        }
    }

    #applyDaggerSkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit) {
        if (attackUnit.hasDagger7Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -7);
        } else if (attackUnit.hasDagger6Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -6);
        } else if (attackUnit.hasDagger5Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -5);
        } else if (attackUnit.hasDagger4Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -4);
        } else if (attackUnit.hasDagger3Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -3);
        } else if (attackUnit.weapon === Weapon.PoisonDaggerPlus) {
            if (attackTargetUnit.moveType === MoveType.Infantry) {
                attackTargetUnit.reserveToApplyDefDebuff(-6);
                attackTargetUnit.reserveToApplyResDebuff(-6);
            }
        } else if (attackUnit.weapon === Weapon.PoisonDagger) {
            if (attackTargetUnit.moveType === MoveType.Infantry) {
                attackTargetUnit.reserveToApplyDefDebuff(-4);
                attackTargetUnit.reserveToApplyResDebuff(-4);
            }
        }
    }

    #applyAnAttackSkillEffectAfterCombatNeverthelessDeadForUnit(skillId, attackUnit, attackTargetUnit) {
        switch (skillId) {
            case Weapon.Kvasir:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.IncurablePlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveTakeDamage(7);
                    unit.reserveToAddStatusEffect(StatusEffectType.DeepWounds);
                }
                break;
            case Weapon.DuskDawnStaff:
                if (attackUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(attackTargetUnit, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                }
                break;
            case Weapon.AsameiNoTanken:
                if (attackUnit.isWeaponSpecialRefined) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveTakeDamage(5);
                        unit.reserveToAddStatusEffect(StatusEffectType.Exposure);
                    }
                }
                break;
            case Weapon.SoothingScent:
                if (attackUnit.battleContext.weaponSkillCondSatisfied) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveTakeDamage(10);
                    }
                }
                break;
            case Weapon.CaringConch:
                if (attackUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(attackUnit)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                }
                break;
            case Weapon.QuickMulagir:
                if (attackUnit.isWeaponSpecialRefined) {
                    if (attackUnit.battleContext.initiatesCombat) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.reserveTakeDamage(7);
                        }
                    }
                }
                break;
            case Weapon.BoneCarverPlus:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveTakeDamage(7);
                    }
                }
                break;
            case Weapon.FlamelickBreath:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.DeepWounds);
                    }
                }
                break;
            case Weapon.TigerSpirit:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.FrostbiteBreath:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                }
                break;
            case Weapon.Scadi:
                if (attackUnit.isWeaponSpecialRefined) {
                    if (attackUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.reserveTakeDamage(7);
                        }
                    }
                }
                break;
            case Weapon.ObsessiveCurse:
                if (!attackUnit.isWeaponSpecialRefined) break;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    this.writeLogLine(`${unit.getNameWithGroup()}は${attackUnit.weaponInfo.name}により7ダメージ、反撃不可の状態異常付与`);
                    unit.reserveTakeDamage(7);
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }
                break;
            case Weapon.Buryunhirude:
                if (!attackUnit.isWeaponRefined) {
                    attackTargetUnit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
                break;
            case PassiveC.Jagan:
            case Weapon.GravityPlus:
            case Weapon.Sangurizuru:
            case Weapon.ElisesStaff:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 1, true)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
                break;
            case Weapon.Gravity:
                attackTargetUnit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                break;
            case Weapon.SpringtimeStaff:
                attackTargetUnit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                if (attackUnit.isWeaponSpecialRefined) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.reserveHeal(7);
                    }
                }
                break;
            case Weapon.SlowPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToApplySpdDebuff(-7);
                }
                break;
            case Weapon.Slow:
                attackTargetUnit.reserveToApplySpdDebuff(-6);
                break;
            case Weapon.ElenasStaff:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToApplyAtkDebuff(-7);
                    unit.reserveToApplySpdDebuff(-7);
                    if (attackUnit.isWeaponSpecialRefined) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.FearPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToApplyAtkDebuff(-7);
                }
                break;
            case Weapon.Fear:
                attackTargetUnit.reserveToApplyAtkDebuff(-6);
                break;
            case Weapon.Pesyukado: {
                let amount = attackUnit.isWeaponRefined ? 5 : 4;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                    unit.reserveToApplyAllBuffs(amount);
                }
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToApplyAllDebuff(amount);
                }
                if (!attackUnit.isWeaponSpecialRefined) break;
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    this.writeDebugLogLine(attackUnit.getNameWithGroup() + "の特殊錬成ペシュカド発動");
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                        unit.reserveToIncreaseSpecialCount(1);
                    }
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            }
            case Weapon.Hlidskjalf:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                    unit.reserveToApplyAllBuffs(4);
                }
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToApplyAllDebuff(-4);
                }
                break;
            case Weapon.StaffOfLilies:
            case Weapon.MerankoryPlus:
            case Weapon.CandyStaff:
            case Weapon.CandyStaffPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.setSpecialCountToMax();
                    unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    if (skillId === Weapon.StaffOfLilies) {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    }
                }
                break;
            case Weapon.Candlelight:
                attackTargetUnit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                break;
            case Weapon.DotingStaff:
            case Weapon.CandlelightPlus:
            case Weapon.FlashPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }
                break;
            case Weapon.Trilemma:
                attackTargetUnit.reserveToAddStatusEffect(StatusEffectType.TriangleAdept);
                break;
            case Weapon.TrilemmaPlus:
            case Weapon.PunishmentStaff:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.TriangleAdept);
                }
                break;
            case Weapon.AbsorbPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, false)) {
                    unit.reserveHeal(7);
                }
                break;
            case Weapon.Sekuvaveku: {
                let spaces = attackUnit.isWeaponSpecialRefined ? 4 : 3
                if (this.__isThereAllyInSpecifiedSpaces(attackUnit, spaces)) {
                    for (let unit of this.__findNearestAllies(attackUnit)) {
                        unit.reserveTakeDamage(20);
                    }
                }
            }
                break;
            case Weapon.Thjalfi:
                if (this.__isThereAllyInSpecifiedSpaces(attackUnit, 3)) {
                    for (let unit of this.__findNearestAllies(attackUnit)) {
                        unit.reserveTakeDamage(20);
                    }
                }
                break;
            case Weapon.LightBreath:
            case Weapon.LightBreathPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                    unit.reserveToApplyAllBuffs(5);
                }
                break;
            case Weapon.Ifingr:
                if (this.__isThereAllyInSpecifiedSpaces(attackUnit, 3)) {
                    for (let unit of this.__findNearestAllies(attackUnit)) {
                        unit.reserveToApplyAllDebuff(-4);
                    }
                }
                break;
            case Weapon.GhostNoMadosyo:
            case Weapon.GhostNoMadosyoPlus:
            case Weapon.MonstrousBow:
            case Weapon.MonstrousBowPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                }
                break;
            case Weapon.Panic:
            case Weapon.LegionsAxe:
            case Weapon.RoroNoOnoPlus:
                attackTargetUnit.reserveToAddStatusEffect(StatusEffectType.Panic);
                break;
            case Weapon.GrimasTruth:
                if (!attackUnit.isWeaponRefined) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.reserveToApplyAtkBuff(5);
                        unit.reserveToApplySpdBuff(5);
                    }
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveToApplyAtkDebuff(-5);
                        unit.reserveToApplySpdDebuff(-5);
                    }
                }
                break;
            case Weapon.DeathlyDagger:
                if (attackUnit.isWeaponRefined) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.reserveTakeDamage(10);
                        unit.reserveToApplyDefDebuff(-7);
                        unit.reserveToApplyResDebuff(-7);
                    }
                } else {
                    if (attackUnit.battleContext.initiatesCombat) {
                        attackTargetUnit.reserveTakeDamage(7);
                    }
                    attackTargetUnit.reserveToApplyDefDebuff(-7);
                    attackTargetUnit.reserveToApplyResDebuff(-7);
                }
                break;
            case Weapon.PainPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    this.writeLogLine(unit.getNameWithGroup() + "は" + attackUnit.weaponInfo.name + "により10ダメージ");
                    unit.reserveTakeDamage(10);
                }
                break;
            case Weapon.SneeringAxe: {
                attackTargetUnit.reserveToAddStatusEffect(StatusEffectType.Panic);
            }
                break;
            case Weapon.MitteiNoAnki:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                    unit.reserveToApplyDefBuff(6);
                    unit.reserveToApplyResBuff(6);
                }
                break;
            case Weapon.DokuNoKen:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    this.writeLogLine(unit.getNameWithGroup() + "は" + attackUnit.weaponInfo.name + "により10ダメージ、反撃不可の状態異常付与");
                    unit.reserveTakeDamage(10);
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    if (attackUnit.isWeaponSpecialRefined) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Discord);
                    }
                }
                break;
            case Weapon.PanicPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                }
                break;
            case Weapon.SaizoNoBakuenshin:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToApplyAllDebuff(-6);
                }
                break;
            case Weapon.MeikiNoBreath:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                    unit.reserveToApplyAtkDebuff(-7);
                    unit.reserveToApplySpdDebuff(-7);
                }
                break;
        }
    }

    __applySkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit, attackCount) {
        if (attackUnit.battleContext.hasNonSpecialMiracleAndHealAcitivated) {
            this.globalBattleContext.miracleAndHealWithoutSpecialActivationCount[attackUnit.groupId]++;
            this.globalBattleContext.miracleWithoutSpecialActivationCountInCurrentTurn[attackUnit.groupId]++;
            attackUnit.reserveHeal(99);
        }
        let env = new AfterCombatEnv(this, attackUnit, attackTargetUnit);
        env.setName('戦闘後(死んでも発動)').setLogLevel(getSkillLogLevel());
        AFTER_COMBAT_NEVERTHELESS_HOOKS.evaluateWithUnit(attackUnit, env);
        for (let skillId of attackUnit.enumerateSkills()) {
            let func = getSkillFunc(skillId, applySkillEffectAfterCombatNeverthelessDeadForUnitFuncMap);
            func?.call(this, attackUnit, attackTargetUnit, attackCount);
            switch (skillId) {
                case Special.LifeUnending:
                    if (attackUnit.battleContext.hasSpecialMiracleAndHealActivated) {
                        if (!attackUnit.hasOncePerMapSpecialActivated) {
                            attackUnit.hasOncePerMapSpecialActivated = true;
                            attackUnit.reserveHeal(99);
                        }
                    }
                    break;
                case Special.HolyKnightAura:
                case Special.ChivalricAura:
                    if (attackUnit.battleContext.hasSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.reserveToApplyBuffs(6, 0, 0, 0);
                            unit.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                        }
                    }
                    break;
                case Special.ShiningEmblem:
                    if (attackUnit.battleContext.hasSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.reserveToApplyAllBuffs(6);
                        }
                    }
                    break;
                case Special.HerosBlood:
                case Special.HonoNoMonsyo:
                    if (attackUnit.battleContext.hasSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.reserveToApplyAllBuffs(4);
                        }
                    }
                    break;
                case Special.RighteousWind:
                    if (attackUnit.battleContext.hasSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.reserveHeal(10);
                        }
                    }
                    break;
            }
        }
    }

    __applyDaggerEffect(attackUnit, attackTargetUnit, debuffAmount) {
        this.writeLogLine(attackUnit.getNameWithGroup() + "の暗器(" + debuffAmount + ")効果発動");
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
            unit.reserveToApplyDefDebuff(debuffAmount);
            unit.reserveToApplyResDebuff(debuffAmount);
        }
    }

    __applyHoneSkill(skillOwnerUnit, isApplicableFunc, applyBuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1, false)) {
            if (isApplicableFunc(unit)) {
                applyBuffFunc(unit);
            }
        }
    }

    __applySmokeSkill(attackTargetUnit, debuffFunc, withTargetUnit = false) {
        let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, withTargetUnit);
        for (let unit of units) {
            debuffFunc(unit);
        }
    }

    #applyPostCombatAllySkills(combatUnit) {
        let allies = this.enumerateUnitsInTheSameGroupOnMap(combatUnit);
        for (let ally of allies) {
            for (let skillId of ally.enumerateSkills()) {
                getSkillFunc(skillId, applyPostCombatAllySkillFuncMap)?.call(this, ally, combatUnit);
            }
        }
    }
}
