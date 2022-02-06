

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
    writeLogLine(log) {
        this._logger.writeLog(log);
    }
    writeDebugLogLine(log) {
        this._logger.writeDebugLog(log);
    }

    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }

    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return this._unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }

    enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
    }

    enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit) {
        return this._unitManager.enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit);
    }
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
        }

        // 最初の戦闘のみで発動する状態効果は、状態が付与されていない戦闘も最初の戦闘にカウントするので
        // 強制的にtrueにする
        atkUnit.setOnetimeActionActivated();
        defUnit.setOnetimeActionActivated();

        // 戦闘後発動のスキル効果
        if (atkUnit.isAlive) {
            if (result.atkUnit_actualTotalAttackCount > 0) {
                this.writeDebugLogLine(atkUnit.getNameWithGroup() + "の戦闘後発動のスキル効果を評価");
                this.__applyOverlappableSkillEffectFromAttackerAfterCombat(atkUnit, defUnit);
                this.__applyAttackSkillEffectAfterCombat(atkUnit, defUnit);
            }

            this.__applySkillEffectAfterCombatForUnit(atkUnit, defUnit);
        }

        if (defUnit.isAlive) {
            if (result.defUnit_actualTotalAttackCount > 0) {
                this.__applyAttackSkillEffectForDefenseAfterCombat(defUnit, atkUnit);
                this.__applyAttackSkillEffectAfterCombat(defUnit, atkUnit);
            }
            this.__applySkillEffectAfterCombatForUnit(defUnit, atkUnit);
        }

        if (result.atkUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(atkUnit, defUnit, result.atkUnit_actualTotalAttackCount);

        if (result.defUnit_actualTotalAttackCount > 0) {
            this.__applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit);
        }
        this.__applySkillEffectAfterCombatNeverthelessDeadForUnit(defUnit, atkUnit, result.defUnit_actualTotalAttackCount);

        // 不治の幻煙による回復無効化
        {
            if (atkUnit.battleContext.invalidatesHeal) {
                defUnit.reservedHeal = 0;
            }
            if (defUnit.battleContext.invalidatesHeal) {
                atkUnit.reservedHeal = 0;
            }
        }

        // 奥義カウントやHP変動の加減値をここで確定
        for (let unit of this.enumerateAllUnitsOnMap()) {
            unit.modifySpecialCount();
            if (!unit.isDead) {
                unit.applyReservedHp(true);
            }
        }
    }


    __applyOverlappableSkillEffectFromAttackerAfterCombat(atkUnit, attackTargetUnit) {
        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Simuberin:
                    if (!atkUnit.isWeaponRefined) {
                        this.__applyHoneSkill(atkUnit, x => true, x => x.applyAtkBuff(4));
                    }
                    break;
                case Weapon.KuraineNoYumi:
                case Weapon.KuraineNoYumiPlus:
                case Weapon.YamiNoBreath:
                case Weapon.YamiNoBreathPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, false)) {
                        unit.applyAtkDebuff(-5);
                        unit.applySpdDebuff(-5);
                    }
                    break;
                case Weapon.FirstBite:
                case Weapon.FirstBitePlus:
                case Weapon.KyupittoNoYa:
                case Weapon.KyupittoNoYaPlus:
                case Weapon.SeinaruBuke:
                case Weapon.SeinaruBukePlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 2, false)) {
                        unit.applyDefBuff(2);
                        unit.applyResBuff(2);
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
                    atkUnit.heal(4);
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
                        unit.applyAtkDebuff(-7);
                        unit.applySpdDebuff(-7);
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
        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.KyupidNoYaPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, false)) {
                        unit.applyDefBuff(2);
                        unit.applyResBuff(2);
                    }
                    break;
                case Weapon.BridesFang:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        attackUnit.specialCount -= 1;
                    }
                    break;
                case Weapon.SpendthriftBowPlus:
                    attackUnit.specialCount += 2;
                    break;
                case Weapon.Rifia:
                    if (attackUnit.battleContext.restHpPercentage >= 50) {
                        attackUnit.reserveTakeDamage(4);
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
                    if (!targetUnit.isWeaponRefined) {
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


    __applySkillEffectAfterCombatForUnit(targetUnit, enemyUnit) {
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
                        targetUnit.specialCount += 1;
                    }
                    break;
            }
        }
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
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
                        targetUnit.addStatusEffect(StatusEffectType.FallenStar);
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 1, true)) {
                            unit.addStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                    break;
                case Weapon.Aureola:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, true)) {
                        unit.reserveHeal(7);
                    }
                    break;
                case Weapon.DarkCreatorS:
                    targetUnit.isOneTimeActionActivatedForWeapon = true;
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
                            targetUnit.specialCount -= 1;
                        }
                    }
                    break;
                case Weapon.RauarRabbitPlus:
                case Weapon.BlarRabbitPlus:
                case Weapon.ConchBouquetPlus:
                case Weapon.MelonFloatPlus:
                case Weapon.HiddenThornsPlus:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.reserveHeal(7);
                        targetUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case Weapon.StarpointLance:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.reserveHeal(10);
                        targetUnit.isOneTimeActionActivatedForWeapon = true;
                    }
                    break;
                case PassiveB.SealAtk1: enemyUnit.applyAtkDebuff(-3); break;
                case PassiveB.SealAtk2: enemyUnit.applyAtkDebuff(-5); break;
                case PassiveB.SealAtk3: enemyUnit.applyAtkDebuff(-7); break;
                case PassiveB.SealSpd1: enemyUnit.applySpdDebuff(-3); break;
                case PassiveB.SealSpd2: enemyUnit.applySpdDebuff(-5); break;
                case PassiveB.SealSpd3: enemyUnit.applySpdDebuff(-7); break;
                case PassiveB.SealDef1: enemyUnit.applyDefDebuff(-3); break;
                case PassiveB.SealDef2: enemyUnit.applyDefDebuff(-5); break;
                case PassiveB.SealDef3: enemyUnit.applyDefDebuff(-7); break;
                case PassiveB.SealRes1: enemyUnit.applyResDebuff(-3); break;
                case PassiveB.SealRes2: enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SealRes3: enemyUnit.applyResDebuff(-7); break;
                case PassiveB.SealAtkSpd1: enemyUnit.applyAtkDebuff(-3); enemyUnit.applySpdDebuff(-3); break;
                case PassiveB.SealAtkDef1: enemyUnit.applyAtkDebuff(-3); enemyUnit.applyDefDebuff(-3); break;
                case PassiveB.SealDefRes1: enemyUnit.applyDefDebuff(-3); enemyUnit.applyResDebuff(-3); break;
                case PassiveB.SealSpdDef1: enemyUnit.applySpdDebuff(-3); enemyUnit.applyDefDebuff(-3); break;
                case PassiveB.SealSpdRes1: enemyUnit.applySpdDebuff(-3); enemyUnit.applyResDebuff(-3); break;
                case PassiveB.SealAtkSpd2: enemyUnit.applyAtkDebuff(-5); enemyUnit.applySpdDebuff(-5); break;
                case PassiveB.SealAtkDef2: enemyUnit.applyAtkDebuff(-5); enemyUnit.applyDefDebuff(-5); break;
                case PassiveB.SealAtkRes2: enemyUnit.applyAtkDebuff(-5); enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SealDefRes2: enemyUnit.applyDefDebuff(-5); enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SealSpdDef2: enemyUnit.applySpdDebuff(-5); enemyUnit.applyDefDebuff(-5); break;
                case PassiveB.SealSpdRes2: enemyUnit.applySpdDebuff(-5); enemyUnit.applyResDebuff(-5); break;
                case PassiveB.SeimeiNoGofu3:
                    targetUnit.reserveHeal(6);
                    break;
                case Weapon.TaguelChildFang:
                    if (targetUnit.hpPercentage <= 75) {
                        targetUnit.specialCount -= 2;
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
                    if (targetUnit.battleContext.hpBeforeCombat == targetUnit.maxHpWithSkills) {
                        this.writeLogLine("渾身3による1ダメージ");
                        targetUnit.reserveTakeDamage(1);
                    }
                    break;
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
                case PassiveB.OgiNoRasen3:
                case Weapon.MakenMistoruthin:
                    if (targetUnit.battleContext.isSpecialActivated) {
                        targetUnit.specialCount -= 2;
                    }
                    break;
                case PassiveC.FatalSmoke3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.DeepWounds);
                    }
                    break;
                case PassiveC.PanicSmoke3:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case PassiveC.KodoNoGenen3:
                    this.writeDebugLogLine(targetUnit.getNameWithGroup() + "の鼓動の幻煙3発動");
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                        this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                        unit.specialCount += 1;
                    }
                    break;
                case PassiveB.Atrocity:
                    if (enemyUnit.battleContext.restHpPercentage >= 50) {
                        this.writeDebugLogLine(targetUnit.getNameWithGroup() + "の無惨発動");
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemyUnit, 2, true)) {
                            this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                            unit.specialCount += 1;
                            unit.applyAllDebuff(-5);
                        }
                    }
                    break;
                case PassiveC.AtkSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applyAtkDebuff(-3)); break;
                case PassiveC.AtkSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applyAtkDebuff(-5)); break;
                case PassiveC.AtkSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applyAtkDebuff(-7)); break;
                case PassiveC.SpdSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applySpdDebuff(-3)); break;
                case PassiveC.SpdSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applySpdDebuff(-5)); break;
                case PassiveC.SpdSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applySpdDebuff(-7)); break;
                case PassiveC.DefSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applyDefDebuff(-3)); break;
                case PassiveC.DefSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applyDefDebuff(-5)); break;
                case PassiveC.DefSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applyDefDebuff(-7)); break;
                case PassiveC.ResSmoke1: this.__applySmokeSkill(enemyUnit, x => x.applyResDebuff(-3)); break;
                case PassiveC.ResSmoke2: this.__applySmokeSkill(enemyUnit, x => x.applyResDebuff(-5)); break;
                case PassiveC.ResSmoke3: this.__applySmokeSkill(enemyUnit, x => x.applyResDebuff(-7)); break;
            }
        }
    }
    __applyAttackSkillEffectForDefenseAfterCombat(defUnit, atkUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Kurimuhirudo:
                    if (atkUnit.isRangedWeaponType()) {
                        for (let unit of this.__findNearestAllies(defUnit, 2)) {
                            unit.reserveTakeDamage(20);
                        }
                    }
                    break;
            }
        }
    }


    __applyAttackSkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit) {
        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.BoneCarverPlus:
                    if (attackUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.reserveTakeDamage(7);
                        }
                    }
                    break;
                case Weapon.SerpentineStaffPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.DeepWounds);
                    }
                    break;
                case Weapon.FlamelickBreath:
                    if (attackUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.addStatusEffect(StatusEffectType.DeepWounds);
                        }
                    }
                    break;
                case Weapon.TigerSpirit:
                    if (attackUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.addStatusEffect(StatusEffectType.Panic);
                        }
                    }
                    break;
                case Weapon.FrostbiteBreath:
                    if (attackUnit.battleContext.restHpPercentage >= 25) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
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
                        unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                    break;
                case Weapon.Buryunhirude:
                    if (!attackUnit.isWeaponRefined) {
                        attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    }
                    break;
                case PassiveC.Jagan:
                case Weapon.GravityPlus:
                case Weapon.Sangurizuru:
                case Weapon.ElisesStaff:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 1, true)) {
                        unit.addStatusEffect(StatusEffectType.Gravity);
                    }
                    break;
                case Weapon.Gravity:
                    attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    break;
                case Weapon.SpringtimeStaff:
                    attackTargetUnit.addStatusEffect(StatusEffectType.Gravity);
                    if (attackUnit.isWeaponSpecialRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                            unit.reserveHeal(7);
                        }
                    }
                    break;
                case Weapon.SlowPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applySpdDebuff(-7);
                    }
                    break;
                case Weapon.Slow:
                    attackTargetUnit.applySpdDebuff(-6);
                    break;
                case Weapon.ElenasStaff:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-7);
                        unit.applySpdDebuff(-7);
                        if (attackUnit.isWeaponSpecialRefined) {
                            unit.addStatusEffect(StatusEffectType.Panic);
                        }
                    }
                    break;
                case Weapon.FearPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-7);
                    }
                    break;
                case Weapon.Fear:
                    attackTargetUnit.applyAtkDebuff(-6);
                    break;
                case Weapon.Pesyukado: {
                    let amount = attackUnit.isWeaponRefined ? 5 : 4;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyAllBuff(amount);
                    }
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAllDebuff(amount);
                    }
                    if (!attackUnit.isWeaponSpecialRefined) break;
                    if (attackUnit.battleContext.restHpPercentage >= 25) {
                        this.writeDebugLogLine(attackUnit.getNameWithGroup() + "の特殊錬成ペシュカド発動");
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            this.writeDebugLogLine(unit.getNameWithGroup() + "の奥義カウントを+1");
                            unit.specialCount += 1;
                        }
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                            unit.specialCount -= 1;
                        }
                    }
                    break;
                }
                case Weapon.Hlidskjalf:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyAllBuff(4);
                    }
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAllDebuff(-4);
                    }
                    break;
                case Weapon.MerankoryPlus:
                case Weapon.CandyStaff:
                case Weapon.CandyStaffPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.setSpecialCountToMax();
                        unit.addStatusEffect(StatusEffectType.Guard);
                    }
                    break;
                case Weapon.Candlelight:
                    attackTargetUnit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    break;
                case Weapon.CandlelightPlus:
                case Weapon.FlashPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                    break;
                case Weapon.Trilemma:
                    attackTargetUnit.addStatusEffect(StatusEffectType.TriangleAdept);
                    break;
                case Weapon.TrilemmaPlus:
                case Weapon.PunishmentStaff:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.TriangleAdept);
                    }
                    break;
                case Weapon.AbsorbPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, false)) {
                        unit.reserveHeal(7);
                    }
                    break;
                case Weapon.Sekuvaveku:
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
                        unit.applyAllBuff(5);
                    }
                    break;
                case Weapon.Ifingr:
                    if (this.__isThereAllyInSpecifiedSpaces(attackUnit, 3)) {
                        for (let unit of this.__findNearestAllies(attackUnit)) {
                            unit.applyAllDebuff(-4);
                        }
                    }
                    break;
                case Weapon.GhostNoMadosyo:
                case Weapon.GhostNoMadosyoPlus:
                case Weapon.MonstrousBow:
                case Weapon.MonstrousBowPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case Weapon.Panic:
                case Weapon.LegionsAxe:
                case Weapon.RoroNoOnoPlus:
                    attackTargetUnit.addStatusEffect(StatusEffectType.Panic);
                    break;
                case Weapon.GrimasTruth:
                    if (!attackUnit.isWeaponRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                            unit.applyAtkBuff(5);
                            unit.applySpdBuff(5);
                        }
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.applyAtkDebuff(-5);
                            unit.applySpdDebuff(-5);
                        }
                    }
                    break;
                case Weapon.DeathlyDagger:
                    if (attackUnit.isWeaponRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                            unit.reserveTakeDamage(10);
                            unit.applyDefDebuff(-7);
                            unit.applyResDebuff(-7);
                        }
                    }
                    else {
                        if (attackUnit.battleContext.initiatesCombat) {
                            attackTargetUnit.reserveTakeDamage(7);
                        }
                        attackTargetUnit.applyDefDebuff(-7);
                        attackTargetUnit.applyResDebuff(-7);
                    }
                    break;
                case Weapon.PainPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は" + attackUnit.weaponInfo.name + "により10ダメージ");
                        unit.reserveTakeDamage(10);
                    }
                    break;
                case Weapon.SneeringAxe:
                    {
                        attackTargetUnit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case Weapon.MitteiNoAnki:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackUnit, 2, true)) {
                        unit.applyDefBuff(6);
                        unit.applyResBuff(6);
                    }
                    break;
                case Weapon.DokuNoKen:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        this.writeLogLine(unit.getNameWithGroup() + "は" + attackUnit.weaponInfo.name + "により10ダメージ、反撃不可の状態異常付与");
                        unit.reserveTakeDamage(10);
                        unit.addStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                    break;
                case Weapon.PanicPlus:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.addStatusEffect(StatusEffectType.Panic);
                    }
                    break;
                case Weapon.SaizoNoBakuenshin:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAllDebuff(-6);
                    }
                    break;
                case Weapon.MeikiNoBreath:
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, true)) {
                        unit.applyAtkDebuff(-7);
                        unit.applySpdDebuff(-7);
                    }
                    break;
            }
        }

        if (attackUnit.hasDagger7Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -7);
        }
        else if (attackUnit.hasDagger6Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -6);
        }
        else if (attackUnit.hasDagger5Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -5);
        }
        else if (attackUnit.hasDagger4Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -4);
        }
        else if (attackUnit.hasDagger3Effect()) {
            this.__applyDaggerEffect(attackUnit, attackTargetUnit, -3);
        } else if (attackUnit.weapon == Weapon.PoisonDaggerPlus) {
            if (attackTargetUnit.moveType == MoveType.Infantry) {
                attackTargetUnit.applyDefDebuff(-6);
                attackTargetUnit.applyResDebuff(-6);
            }
        } else if (attackUnit.weapon == Weapon.PoisonDagger) {
            if (attackTargetUnit.moveType == MoveType.Infantry) {
                attackTargetUnit.applyDefDebuff(-4);
                attackTargetUnit.applyResDebuff(-4);
            }
        }
    }

    __applySkillEffectAfterCombatNeverthelessDeadForUnit(attackUnit, attackTargetUnit, attackCount) {
        for (let skillId of attackUnit.enumerateSkills()) {
            switch (skillId) {
                case Special.LifeUnending:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        if (!attackUnit.isOncePerMapSpecialActivated) {
                            attackUnit.isOncePerMapSpecialActivated = true;
                            attackUnit.reserveHeal(99);
                        }
                    }
                    break;
                case Special.HolyKnightAura:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.applyAtkBuff(6);
                            unit.addStatusEffect(StatusEffectType.MobilityIncreased);
                        }
                    }
                    break;
                case Special.ShiningEmblem:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.applyAllBuff(6);
                        }
                    }
                    break;
                case Special.HerosBlood:
                case Special.HonoNoMonsyo:
                    if (attackUnit.battleContext.isSpecialActivated) {
                        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(attackUnit, true)) {
                            unit.applyAllBuff(4);
                        }
                    }
                    break;
                case Special.RighteousWind:
                    if (attackUnit.battleContext.isSpecialActivated) {
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
            unit.applyDefDebuff(debuffAmount);
            unit.applyResDebuff(debuffAmount);
        }
    }

    __applyHoneSkill(skillOwnerUnit, isApplicableFunc, applyBuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1, false)) {
            if (isApplicableFunc(unit)) {
                applyBuffFunc(unit);
            }
        }
    }

    __applySmokeSkill(attackTargetUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(attackTargetUnit, 2, false)) {
            debuffFunc(unit);
        }
    }
}
