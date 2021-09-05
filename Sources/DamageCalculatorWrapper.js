
class DamageCalculatorWrapper {
    /// @param {UnitManager} unitManager ユニットマネージャーのインスタンス
    constructor(unitManager, map, globalBattleContext) {
        this._unitManager = unitManager;
        this.map = map;
        this.globalBattleContext = globalBattleContext;
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

    get currentTurn() {
        return this.globalBattleContext.currentTurn;
    }

    get isOddTurn() {
        return this.globalBattleContext.isOddTurn;
    }
    get isEvenTurn() {
        return this.globalBattleContext.isEvenTurn;
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

        this.__setBattleContextRelatedToMap(atkUnit, defUnit, calcPotentialDamage);
        this.__setBattleContextRelatedToMap(defUnit, atkUnit, calcPotentialDamage);

        this.__applyImpenetrableDark(atkUnit, defUnit, calcPotentialDamage);
        this.__applyImpenetrableDark(defUnit, atkUnit, calcPotentialDamage);

        this.__applySkillEffect(atkUnit, defUnit, calcPotentialDamage);
        this.__applySkillEffectForUnit(atkUnit, defUnit, calcPotentialDamage);
        this.__applySkillEffectForUnit(defUnit, atkUnit, calcPotentialDamage);

        this.__applySkillEffectRelatedToEnemyStatusEffects(atkUnit, defUnit, calcPotentialDamage);
        this.__applySkillEffectRelatedToEnemyStatusEffects(defUnit, atkUnit, calcPotentialDamage);

        // 紋章を除く味方ユニットからの戦闘中バフ
        {
            this.__applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit);
            this.__applySkillEffectFromAllies(atkUnit, defUnit, calcPotentialDamage);
            this.__applySkillEffectFromAllies(defUnit, atkUnit, calcPotentialDamage);
        }

        // 1回の攻撃の攻撃回数を設定
        this.__setAttackCount(atkUnit, defUnit);
        this.__setAttackCount(defUnit, atkUnit);

        // 神罰の杖
        this.__setWrathfulStaff(atkUnit, defUnit);
        this.__setWrathfulStaff(defUnit, atkUnit);

        // 特効
        this.__setEffectiveAttackEnabledIfPossible(atkUnit, defUnit);
        this.__setEffectiveAttackEnabledIfPossible(defUnit, atkUnit);

        // スキル内蔵の全距離反撃
        defUnit.battleContext.canCounterattackToAllDistance = defUnit.canCounterAttackToAllDistance();

        // 戦闘中バフが決まった後に評価するスキル効果
        {
            this.__applySpurForUnitAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            this.__applySpurForUnitAfterCombatStatusFixed(defUnit, atkUnit, calcPotentialDamage);

            this.__applySkillEffectForUnitAfterCombatStatusFixed(atkUnit, defUnit, calcPotentialDamage);
            this.__applySkillEffectForUnitAfterCombatStatusFixed(defUnit, atkUnit, calcPotentialDamage);
        }

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

    __setBattleContextRelatedToMap(targetUnit, enemyUnit, calcPotentialDamage) {
        targetUnit.battleContext.isOnDefensiveTile = targetUnit.placedTile.isDefensiveTile;
    }

    __applyImpenetrableDark(targetUnit, enemyUnit, calcPotentialDamage) {
        switch (targetUnit.passiveC) {
            case PassiveC.ImpenetrableDark:
                this.updateUnitSpur(enemyUnit, calcPotentialDamage, true);
                break;
        }
    }

    /// 戦闘順入れ替えスキルを適用します。
    __applyChangingAttackPrioritySkillEffects(atkUnit, defUnit) {
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.HolyWarsEnd:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        defUnit.battleContext.isDefDesperationActivatable = true;
                    }
                    break;
                case Weapon.Urvan:
                    {
                        if (defUnit.isWeaponSpecialRefined) {
                            // 敵に攻め立て強制
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
            }
        }

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.YngviAscendant:
                    atkUnit.battleContext.isDesperationActivatable = true;
                    break;
                case Weapon.NewDawn:
                case PassiveB.Frenzy3:
                    if (atkUnit.snapshot.restHpPercentage <= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.Thunderbrand:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.TalreganAxe:
                    atkUnit.battleContext.isDesperationActivatable = true;
                    break;
                case Weapon.DarkSpikesT:
                    if (atkUnit.snapshot.restHpPercentage <= 99) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.Forusethi:
                    if (atkUnit.isWeaponRefined) {
                        if (atkUnit.snapshot.restHpPercentage >= 25) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    else {
                        if (atkUnit.snapshot.restHpPercentage >= 50) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.YonkaiNoSaiki:
                case Weapon.AnkokuNoKen:
                    if (atkUnit.snapshot.restHpPercentage >= 50) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case PassiveB.KyusyuTaikei3:
                    atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    if (atkUnit.snapshot.restHpPercentage <= 80) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.SoulCaty:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.snapshot.restHpPercentage <= 75) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    else {
                        if (atkUnit.snapshot.restHpPercentage <= 50) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case PassiveB.DiveBomb3:
                    if (atkUnit.snapshot.restHpPercentage >= 80 && defUnit.snapshot.restHpPercentage >= 80) {
                        atkUnit.battleContext.isDesperationActivatable = true;
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
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
                case Weapon.IhoNoHIken:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (atkUnit.snapshot.restHpPercentage <= 75) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case PassiveB.KillingIntent:
                    {
                        if (defUnit.snapshot.restHpPercentage < 100 || defUnit.hasNegativeStatusEffect()) {
                            atkUnit.battleContext.isDesperationActivatable = true;
                        }
                    }
                    break;
                case Weapon.HigaimosoNoYumi:
                    if (atkUnit.hasNegativeStatusEffect()
                        || !atkUnit.snapshot.isRestHpFull
                    ) {
                        atkUnit.battleContext.isDesperationActivatable = true;
                    }
                    break;
            }
        }
    }

    __applySkillEffect(atkUnit, defUnit, calcPotentialDamage) {
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(defUnit, 2)) {
            switch (unit.weapon) {
                case Weapon.ElisesStaff:
                    if (unit.isWeaponSpecialRefined) {
                        defUnit.addAllSpur(-4);
                    }
                    break;
                case Weapon.RaisenNoSyo:
                    if (unit.isWeaponSpecialRefined) {
                        defUnit.spdSpur -= 5;
                        defUnit.resSpur -= 5;
                    }
                    break;
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
                    defUnit.atkSpur -= 4;
                    defUnit.defSpur -= 4;
                    break;
            }
        }

        this.__applyChangingAttackPrioritySkillEffects(atkUnit, defUnit);

        for (let skillId of atkUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.InstantLancePlus:
                    atkUnit.atkSpur += 4;
                    atkUnit.defSpur += 4;
                    break;
                case Weapon.CourtlyFanPlus:
                    atkUnit.atkSpur += 5;
                    atkUnit.spdSpur += 5;
                    atkUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    break;
                case Weapon.BenihimeNoOno:
                    if (atkUnit.isWeaponSpecialRefined) {
                        if (defUnit.snapshot.restHpPercentage == 100) {
                            atkUnit.atkSpur += 5;
                            atkUnit.defSpur += 5;
                            atkUnit.battleContext.increaseCooldownCountForBoth();
                        }
                    }
                    break;
                case Weapon.KurooujiNoYari:
                    if (defUnit.snapshot.restHpPercentage == 100) {
                        atkUnit.atkSpur += 5;
                        atkUnit.defSpur += 5;
                        atkUnit.resSpur += 5;
                    }
                    break;
                case Weapon.SummerStrikers:
                    if (atkUnit.snapshot.restHpPercentage >= 25) {
                        atkUnit.atkSpur += 5;
                        atkUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.HewnLance:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 4;
                        atkUnit.defSpur += 4;
                    }
                    break;
                case Weapon.WhitedownSpear:
                    if (this.__countUnit(atkUnit.groupId, x => x.isOnMap && x.moveType == MoveType.Flying) >= 3) {
                        defUnit.atkSpur -= 4;
                        defUnit.defSpur -= 4;
                    }
                    break;
                case PassiveB.BeliefInLove:
                    if (defUnit.snapshot.restHpPercentage == 100) {
                        defUnit.atkSpur -= 5;
                        defUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.SatougashiNoAnki:
                    atkUnit.spdSpur += 4;
                    break;
                case Weapon.RinkahNoOnikanabo:
                    if (atkUnit.snapshot.restHpPercentage < 100) {
                        atkUnit.atkSpur += 5;
                        atkUnit.defSpur += 5;
                        atkUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.KokyousyaNoYari:
                    if (defUnit.snapshot.restHpPercentage >= 70) {
                        atkUnit.atkSpur += 5;
                        atkUnit.resSpur += 5;
                    }
                    break;
                case Weapon.HadesuOmega:
                    atkUnit.atkSpur += 4;
                    atkUnit.spdSpur += 4;
                    if (atkUnit.hasSpecial && atkUnit.tmpSpecialCount == 0) {
                        atkUnit.atkSpur += 6;
                    }
                    break;
                case Weapon.ZekkaiNoSoukyu:
                    if (defUnit.snapshot.restHpPercentage == 100) {
                        atkUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.GeneiFeather:
                    if (this.__isThereAnyAllyUnit(atkUnit, x => x.isActionDone)) {
                        atkUnit.atkSpur += 6;
                        atkUnit.spdSpur += 6;
                        atkUnit.battleContext.isDesperationActivated = true;
                    }
                    break;
                case Weapon.EishinNoAnki:
                    atkUnit.atkSpur += 5;
                    atkUnit.spdSpur += 5;
                    break;
                case Weapon.KinranNoSyo:
                    atkUnit.atkSpur += 6;
                    break;
                case Weapon.HelmsmanAxePlus:
                case Weapon.RauaFoxPlus:
                case Weapon.BlarfoxPlus:
                case Weapon.GronnfoxPlus:
                    defUnit.addAllSpur(-4);
                    break;
                case Weapon.RohyouNoKnife:
                    if (defUnit.isMeleeWeaponType() || atkUnit.isWeaponRefined) {
                        atkUnit.defSpur += 20;
                    }
                    break;
                case Weapon.Paruthia:
                    if (!atkUnit.isWeaponRefined) {
                        atkUnit.resSpur += 4;
                    }
                    else {
                        if (isWeaponTypeTome(defUnit.weaponType)) {
                            atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, defUnit);
                        }
                        if (atkUnit.isWeaponSpecialRefined) {
                            if (defUnit.isRangedWeaponType()) {
                                atkUnit.atkSpur += 6;
                            }
                        }
                    }
                    break;
                case Weapon.Yatonokami:
                    if (atkUnit.weaponRefinement == WeaponRefinementType.None) {
                        atkUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.KageroNoGenwakushin:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, defUnit);
                    }
                    break;
                case Weapon.KaigaraNoYari:
                case Weapon.KiagaraNoYariPlus:
                case Weapon.BeachFlag:
                case Weapon.BeachFlagPlus:
                case Weapon.YashiNoMiNoYumi:
                case Weapon.YashiNoMiNoYumiPlus:
                    atkUnit.addAllSpur(2);
                    break;
                case Weapon.Sangurizuru:
                    atkUnit.atkSpur += 3;
                    atkUnit.spdSpur += 3;
                    break;
                case Weapon.GeneiFalcion:
                    {
                        let count = this.__countAlliesActionDone(atkUnit);
                        let amount = Math.min(7, count * 2 + 3);
                        atkUnit.atkSpur += amount;
                        atkUnit.spdSpur += amount;
                    }
                    break;
                case PassiveA.YaibaNoSession3:
                    if (!calcPotentialDamage) {
                        let count = this.__countAlliesActionDone(atkUnit);
                        let amount = Math.min(9, count * 3 + 3);
                        atkUnit.atkSpur += amount;
                        atkUnit.spdSpur += amount;
                    }
                    break;
                case PassiveA.SteadyImpact:
                    atkUnit.spdSpur += 7;
                    atkUnit.defSpur += 10;
                    break;
                case PassiveA.SwiftImpact:
                    atkUnit.spdSpur += 7;
                    atkUnit.resSpur += 10;
                    break;
                case PassiveA.KishinKongoNoSyungeki:
                    atkUnit.atkSpur += 6;
                    atkUnit.defSpur += 10;
                    break;
                case PassiveA.KishinMeikyoNoSyungeki:
                    atkUnit.atkSpur += 6;
                    atkUnit.resSpur += 10;
                    break;
                case Weapon.BlazingDurandal:
                    atkUnit.battleContext.increaseCooldownCountForBoth();
                    atkUnit.battleContext.reducesCooldownCount = true;
                    if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                        atkUnit.spdSpur += 7;
                        atkUnit.defSpur += 10;
                    }
                    break;
                case Weapon.Balmung:
                    if (defUnit.snapshot.isRestHpFull) {
                        atkUnit.battleContext.invalidateAllOwnDebuffs();
                        atkUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.NinissIceLance:
                    atkUnit.addAllSpur(4);
                    break;
                case Weapon.Forblaze:
                    if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                        atkUnit.atkSpur += 6;
                    }
                    break;
                case Weapon.HanasKatana:
                    if (isWeaponSpecialRefined(atkUnit.weaponRefinement)) {
                        atkUnit.atkSpur += 4;
                        atkUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.Durandal:
                    atkUnit.atkSpur += 6;
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 4;
                        atkUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.FurederikuNoKenfu:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 6;
                    }
                    break;
                case Weapon.AijouNoHanaNoYumiPlus:
                case Weapon.BukeNoSteckPlus:
                    atkUnit.atkSpur += 4;
                    atkUnit.defSpur += 4;
                    break;
                case Weapon.JokerNoSyokki:
                    defUnit.addAllSpur(-4);
                    if (atkUnit.isWeaponSpecialRefined) {
                        let isActivated = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(atkUnit, 3, false)) {
                            if (!unit.isFullHp) {
                                isActivated = true;
                                break;
                            }
                        }
                        if (isActivated) {
                            atkUnit.addAllSpur(4);
                        }
                    }
                    break;
                case PassiveA.DeathBlow3:
                    atkUnit.atkSpur += 6;
                    break;
                case PassiveA.DeathBlow4: atkUnit.atkSpur += 8; break;
                case Weapon.Toron:
                case Weapon.MiraiNoSeikishiNoYari:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.spdSpur += 6;
                    }
                    break;
                case PassiveA.HienNoIchigeki1: atkUnit.spdSpur += 2; break;
                case PassiveA.HienNoIchigeki2: atkUnit.spdSpur += 4; break;
                case PassiveA.HienNoIchigeki3: atkUnit.spdSpur += 6; break;
                case PassiveA.HienNoIchigeki4: atkUnit.spdSpur += 9; break;
                case PassiveA.KongoNoIchigeki3: atkUnit.defSpur += 6; break;
                case PassiveA.MeikyoNoIchigeki3: atkUnit.resSpur += 6; break;
                case Weapon.KurokiChiNoTaiken:
                case Weapon.FlowerStandPlus:
                case Weapon.CakeKnifePlus:
                case Weapon.SyukuhaiNoBottlePlus:
                case Weapon.SyukuhukuNoHanaNoYumiPlus:
                case PassiveA.KishinHienNoIchigeki2:
                    atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
                    break;
                case Weapon.Amite:
                case Weapon.KazahanaNoReitou:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 4; atkUnit.spdSpur += 4;
                    }
                    break;
                case PassiveA.KishinHienNoIchigeki3: atkUnit.atkSpur += 6; atkUnit.spdSpur += 7; break;
                case PassiveA.KishinKongoNoIchigeki2: atkUnit.atkSpur += 4; atkUnit.defSpur += 4; break;
                case PassiveA.KishinMeikyoNoIchigeki2: atkUnit.atkSpur += 4; atkUnit.resSpur += 4; break;
                case PassiveA.HienKongoNoIchigeki2: atkUnit.spdSpur += 4; atkUnit.defSpur += 4; break;
                case PassiveA.HienMeikyoNoIchigeki2: atkUnit.spdSpur += 4; atkUnit.resSpur += 4; break;
                case PassiveA.KongoMeikyoNoIchigeki2: atkUnit.defSpur += 4; atkUnit.resSpur += 4; break;
                case Weapon.Sogun:
                    if (defUnit.weaponType == WeaponType.Sword
                        || defUnit.weaponType == WeaponType.Lance
                        || defUnit.weaponType == WeaponType.Axe
                        || isWeaponTypeBreath(defUnit.weaponType)) {
                        atkUnit.atkSpur += 4;
                        atkUnit.spdSpur += 4;
                        atkUnit.defSpur += 4;
                        atkUnit.resSpur += 4;
                    }
                    break;
            }
        }

        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Kurimuhirudo:
                    if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.Amatsu:
                case Weapon.Puji:
                    if (defUnit.snapshot.restHpPercentage >= 50) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.TwinCrestPower:
                    if (defUnit.isTransformed) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.ShishiouNoTsumekiba:
                    defUnit.addAllSpur(4);
                    if (defUnit.isTransformed) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.OgonNoTanken:
                    if (defUnit.isSpecialCharged) {
                        defUnit.battleContext.canCounterattackToAllDistance = true;
                    }
                    break;
                case Weapon.BenihimeNoOno:
                    if (atkUnit.isWeaponSpecialRefined) {
                        atkUnit.atkSpur += 5;
                        atkUnit.defSpur += 5;
                        atkUnit.battleContext.increaseCooldownCountForBoth();
                    }
                    break;
                case Weapon.KurooujiNoYari:
                    defUnit.atkSpur += 5;
                    defUnit.defSpur += 5;
                    defUnit.resSpur += 5;
                    break;
                case PassiveB.GuardBearing3:
                    if (!defUnit.isOneTimeActionActivatedForPassiveB) {
                        defUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, atkUnit);
                    }
                    break;
                case Weapon.StalwartSword:
                    atkUnit.atkSpur -= 6;
                    break;
                case PassiveB.BeliefInLove:
                    atkUnit.atkSpur -= 5;
                    atkUnit.defSpur -= 5;
                    break;
                case Weapon.RinkahNoOnikanabo:
                    defUnit.atkSpur += 5;
                    defUnit.defSpur += 5;
                    defUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case PassiveA.DistantFoil:
                case PassiveA.CloseFoil:
                    if (isPhysicalWeaponType(atkUnit.weaponType)) {
                        defUnit.atkSpur += 5;
                        defUnit.defSpur += 5;
                    }
                    break;
                case PassiveA.DistantWard:
                    if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                        defUnit.atkSpur += 5;
                        defUnit.resSpur += 5;
                    }
                    break;
                case PassiveA.CloseWard:
                    if (!isPhysicalWeaponType(atkUnit.weaponType)) {
                        defUnit.atkSpur += 5;
                        defUnit.resSpur += 5;
                        defUnit.battleContext.invalidatesReferenceLowerMit = true;
                    }
                    break;
                case Weapon.KokyousyaNoYari:
                    defUnit.atkSpur += 5;
                    defUnit.resSpur += 5;
                    break;
                case Weapon.Vidofuniru:
                    if (!defUnit.isWeaponRefined) {
                        if (atkUnit.weaponType == WeaponType.Sword
                            || atkUnit.weaponType == WeaponType.Lance
                            || atkUnit.weaponType == WeaponType.Axe
                        ) {
                            defUnit.defSpur += 7;
                        }
                    } else {
                        if (atkUnit.weaponType == WeaponType.Sword
                            || atkUnit.weaponType == WeaponType.Lance
                            || atkUnit.weaponType == WeaponType.Axe
                            || isWeaponTypeBreath(atkUnit.weaponType)
                            || isWeaponTypeBeast(atkUnit.weaponType)
                        ) {
                            defUnit.defSpur += 7;
                            defUnit.ResSpur += 7;
                        }
                    }
                    break;
                case Weapon.Naga:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.defSpur += 4;
                        defUnit.resSpur += 4;
                    }
                    else {
                        defUnit.defSpur += 2;
                        defUnit.resSpur += 2;
                    }
                    break;
                case Weapon.ManatsuNoBreath:
                    defUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case Weapon.FurorinaNoSeisou:
                    if (atkUnit.weaponType == WeaponType.Sword
                        || atkUnit.weaponType == WeaponType.Lance
                        || atkUnit.weaponType == WeaponType.Axe
                        || isWeaponTypeBreathOrBeast(atkUnit.weaponType)
                    ) {
                        defUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.HinataNoMoutou:
                    defUnit.atkSpur += 4;
                    defUnit.defSpur += 4;
                    break;
                case Weapon.OboroNoShitsunagitou:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.isMeleeWeaponType()) {
                            defUnit.resSpur += 6;
                            defUnit.defSpur += 6;
                        }
                    }
                    break;
                case Weapon.YukyuNoSyo:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.resSpur += 4;
                        defUnit.defSpur += 4;
                    }
                    break;
                case Weapon.FutsugyouNoYari:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.atkSpur += 4;
                        defUnit.defSpur += 4;
                    }
                    break;
                case Weapon.ByakuyaNoRyuuseki:
                    if (!atkUnit.isBuffed) {
                        defUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.Blarserpent:
                case Weapon.BlarserpentPlus:
                case Weapon.GronnserpentPlus:
                case Weapon.RauarserpentPlus:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.defSpur += 6;
                        defUnit.resSpur += 6;
                    }
                    break;
                case Weapon.GeneiFalcion:
                    {
                        let count = this.__countEnemiesActionDone(defUnit);
                        let amount = Math.max(3, 7 - count * 2);
                        defUnit.defSpur += amount;
                        defUnit.resSpur += amount;
                    }
                    break;
                case PassiveA.TateNoSession3:
                    if (!calcPotentialDamage) {
                        let count = this.__countEnemiesActionDone(defUnit);
                        let amount = Math.max(3, 9 - count * 3);
                        atkUnit.defSpur += amount;
                        atkUnit.resSpur += amount;
                    }
                    break;
                case Weapon.Balmung:
                    defUnit.battleContext.invalidateAllOwnDebuffs();
                    defUnit.addAllSpur(5);
                    break;
                case PassiveA.DartingBreath:
                    defUnit.spdSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case PassiveA.KishinNoKokyu:
                    defUnit.atkSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case PassiveA.KongoNoKokyu:
                    defUnit.defSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case PassiveA.MeikyoNoKokyu:
                    defUnit.resSpur += 4;
                    defUnit.battleContext.increaseCooldownCountForBoth();
                    break;
                case Weapon.BerkutsLance:
                    defUnit.resSpur += 4;
                    break;
                case Weapon.BerkutsLancePlus:
                    if (defUnit.weaponRefinement == WeaponRefinementType.None) {
                        defUnit.resSpur += 4;
                    } else {
                        defUnit.resSpur += 7;
                    }
                    break;
                case Weapon.Ekkezakkusu:
                    if (defUnit.isWeaponSpecialRefined) {
                        if (atkUnit.isRangedWeaponType()) {
                            defUnit.defSpur += 6;
                            defUnit.resSpur += 6;
                        }
                    }
                    break;
                case PassiveA.DistantDef4:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.defSpur += 8;
                        defUnit.resSpur += 8;
                        defUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveA.CloseDef4:
                    if (atkUnit.isMeleeWeaponType()) {
                        defUnit.defSpur += 8;
                        defUnit.resSpur += 8;
                        defUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.EnkyoriBougyoNoYumiPlus:
                case PassiveA.DistantDef3:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.defSpur += 6;
                        defUnit.resSpur += 6;
                    }
                    break;
                case PassiveA.CloseDef3:
                    if (atkUnit.isMeleeWeaponType()) {
                        defUnit.defSpur += 6;
                        defUnit.resSpur += 6;
                    }
                    break;
                case Weapon.MoumokuNoYumi:
                    if (atkUnit.isRangedWeaponType()) {
                        defUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.HuinNoKen:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.defSpur += 4;
                        defUnit.resSpur += 4;
                    }
                    else {
                        defUnit.defSpur += 2;
                        defUnit.resSpur += 2;
                    }
                    break;
                case Weapon.ShirokiChiNoNaginata:
                    defUnit.atkSpur += 4;
                    defUnit.defSpur += 4;
                    break;
                case Weapon.Seiju:
                case Weapon.SeijuPlus:
                case Weapon.HandBell:
                case Weapon.HandBellPlus:
                case Weapon.PresentBukuro:
                case Weapon.PresentBukuroPlus:
                case Weapon.Syokudai:
                case Weapon.SyokudaiPlus:
                    defUnit.addAllSpur(2);
                    break;
                case Weapon.MamoriNoKen:
                case Weapon.MamoriNoKenPlus:
                case Weapon.MamoriNoYariPlus:
                case Weapon.MamoriNoOnoPlus:
                    defUnit.defSpur += 7;
                    break;
                case Weapon.BariaNoKen:
                case Weapon.BariaNoKenPlus:
                case Weapon.BariaNoYariPlus:
                case Weapon.BarrierAxePlus:
                    defUnit.resSpur += 7;
                    break;
                case Weapon.HankoNoYari:
                case Weapon.HankoNoYariPlus:
                case Weapon.ReprisalAxePlus:
                case PassiveA.KishinNoKamae3:
                    defUnit.atkSpur += 6;
                    break;
                case PassiveA.HienNoKamae3: defUnit.spdSpur += 6; break;
                case PassiveA.KongoNoKamae3: defUnit.defSpur += 6; break;
                case PassiveA.MeikyoNoKamae3: defUnit.resSpur += 6; break;
                case PassiveA.KishinHienNoKamae2:
                    defUnit.atkSpur += 4; defUnit.spdSpur += 4; break;
                case PassiveA.KishinKongoNoKamae1:
                    defUnit.atkSpur += 2; defUnit.defSpur += 2;
                    break;
                case PassiveA.OstiasCounter:
                case Weapon.KorakuNoKazariYariPlus:
                case PassiveA.KishinKongoNoKamae2:
                    defUnit.atkSpur += 4; defUnit.defSpur += 4;
                    break;
                case Weapon.SaladaSandPlus:
                case PassiveA.KishinMeikyoNoKamae2:
                    defUnit.atkSpur += 4; defUnit.resSpur += 4;
                    break;
                case Weapon.GiyuNoYari:
                    if (defUnit.isWeaponSpecialRefined) {
                        defUnit.spdSpur += 4; defUnit.defSpur += 4;
                    }
                    break;
                case PassiveA.HienKongoNoKamae2: defUnit.spdSpur += 4; defUnit.defSpur += 4; break;
                case PassiveA.HienMeikyoNoKamae1: defUnit.spdSpur += 2; defUnit.resSpur += 2; break;
                case PassiveA.HienMeikyoNoKamae2: defUnit.spdSpur += 4; defUnit.resSpur += 4; break;
                case PassiveA.JaryuNoUroko:
                case Weapon.MizuNoBreath:
                case Weapon.MizuNoBreathPlus:
                case PassiveA.KongoMeikyoNoKamae2: defUnit.defSpur += 4; defUnit.resSpur += 4; break;
                case PassiveA.CloseReversal:
                    defUnit.defSpur += 5;
                    break;
                case PassiveA.KongoNoKamae4:
                    defUnit.defSpur += 8;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.MeikyoNoKamae4:
                    defUnit.resSpur += 8;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KishinMeikyoNoKamae3:
                    defUnit.atkSpur += 6;
                    defUnit.resSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.HienKongoNoKamae3:
                    defUnit.spdSpur += 6;
                    defUnit.defSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.SwiftStance3:
                    defUnit.spdSpur += 6;
                    defUnit.resSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KishinKongoNoKamae3:
                    defUnit.atkSpur += 6;
                    defUnit.defSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KishinHienNoKamae3:
                    defUnit.atkSpur += 6;
                    defUnit.spdSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.KongoMeikyoNoKamae3:
                    defUnit.resSpur += 6;
                    defUnit.defSpur += 6;
                    defUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveA.SacaNoOkite:
                    if (this.__countAlliesWithinSpecifiedSpaces(defUnit, 2, x => true) >= 2) {
                        defUnit.addAllSpur(4);
                    }
                    break;
            }
        }
    }

    __getPartnersInSpecifiedRange(targetUnit, spaces) {
        return Array.from(this._unitManager.enumeratePartnersInSpecifiedRange(targetUnit, spaces));
    }

    /// 自身を中心とした縦〇列と横〇列にいる味方の人数を返します
    __countAllyUnitsInClossWithOffset(targetUnit, offset) {
        let count = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit, false)) {
            if (unit.isInClossWithOffset(targetUnit, offset)) {
                ++count;
            }
        }
        return count;
    }

    __isThereBreakableStructureForEnemyIn2Spaces(targetUnit) {
        for (let blockTile of this.map.enumerateBreakableStructureTiles(targetUnit.getEnemyGroupId())) {
            let dist = Math.abs(blockTile.posX - targetUnit.posX) + Math.abs(blockTile.posY - targetUnit.posY);
            if (dist <= 2) {
                return true;
            }
        }
        return false;
    }

    __applySkillEffectForUnit(targetUnit, enemyUnit, calcPotentialDamage) {
        if (!targetUnit.isOneTimeActionActivatedForFallenStar
            && targetUnit.hasStatusEffect(StatusEffectType.FallenStar)
        ) {
            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
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

        DamageCalculatorWrapper.__calcFixedSpecialAddDamage(targetUnit, enemyUnit);

        // 今のところ奥義にしかこの効果が存在しないので、重複しない。もし今後重複する場合は重複時の計算方法を調査して実装する
        targetUnit.battleContext.selfDamageDealtRateToAddSpecialDamage = getSelfDamageDealtRateToAddSpecialDamage(targetUnit.special);

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.DriftingGracePlus:
                case Weapon.LuminousGracePlus:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.WhirlingGrace:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case PassiveC.JointDistGuard:
                    if (this.__isThereAllyIn2Spaces(targetUnit) && enemyUnit.isRangedWeaponType()) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveB.Prescience:
                    enemyUnit.atkSpur -= 5;
                    enemyUnit.resSpur -= 5;
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                    break;
                case Weapon.NewDawn:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                    break;
                case PassiveB.MikiriTsuigeki3:
                case PassiveB.SphiasSoul:
                case Weapon.HakutoshinNoNinjin:
                case Weapon.TenteiNoKen:
                    targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    break;
                case Weapon.MaritaNoKen:
                    if (calcPotentialDamage || targetUnit.battleContext.isSolo) {
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case PassiveB.SeimeiNoGofu3:
                    targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                    break;
                case Weapon.Absorb:
                case Weapon.AbsorbPlus:
                    {
                        targetUnit.battleContext.damageRatioToHeal += 0.5;
                    }
                    break;
                case Weapon.VirtuousTyrfing:
                    if (!targetUnit.battleContext.initiatesCombat
                        || targetUnit.snapshot.restHpPercentage <= 99
                    ) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                        targetUnit.battleContext.healedHpByAttack += 7;
                    }
                    break;
                case Weapon.Taiyo:
                    targetUnit.battleContext.healedHpByAttack += 10;
                    break;
                case Weapon.SeirinNoKenPlus:
                case Weapon.FuyumatsuriNoStickPlus:
                case Weapon.ChisanaSeijuPlus:
                    targetUnit.battleContext.healedHpByAttack += 5;
                    break;
                case PassiveA.SurgeSparrow:
                    if (targetUnit.battleContext.initiatesCombat) {
                        let healRatio = 0.1 + (targetUnit.maxSpecialCount * 0.2);
                        targetUnit.battleContext.maxHpRatioToHealBySpecial += healRatio;
                        targetUnit.atkSpur += 7;
                        targetUnit.spdSpur += 7;
                    }
                    break;
                case Weapon.MoonlessBreath:
                    if (this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
                    }
                    break;
                case Weapon.RauarLionPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.BindingReginleif:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.PhantasmTome:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        enemyUnit.spdSput -= 6;
                        enemyUnit.resSput -= 6;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                        targetUnit.battleContext.invalidatesResBuff = true;
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.7, enemyUnit);
                        }
                    }
                    break;
                case Weapon.Niu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.MakenMistoruthin:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                    }
                    break;
                case Weapon.LoyaltySpear:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 4;
                        enemyUnit.spdSpur -= 4;
                        enemyUnit.defSpur -= 4;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.Reipia:
                case PassiveB.Vantage3: // 待ち伏せ3
                    if (!targetUnit.battleContext.initiatesCombat) {
                        if (targetUnit.snapshot.restHpPercentage <= 75) {
                            targetUnit.battleContext.isVantabeActivatable = true;
                        }
                    }
                    break;
                case Weapon.FeatherSword:
                    if (!targetUnit.battleContext.initiatesCombat) {
                        if (targetUnit.snapshot.restHpPercentage <= 75
                            || enemyUnit.weaponType == WeaponType.Sword
                            || enemyUnit.weaponType == WeaponType.Lance
                            || enemyUnit.weaponType == WeaponType.Axe
                            || enemyUnit.weaponType == WeaponType.ColorlessBow
                            || enemyUnit.moveType == MoveType.Armor
                        ) {
                            targetUnit.battleContext.isVantabeActivatable = true;
                        }
                    }
                    break;
                case Weapon.GenesisFalchion:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(5);
                        let buffTotal = this.__getTotalBuffAmountOfTop3Units(targetUnit);
                        if (buffTotal >= 10) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        }
                        if (buffTotal >= 25) {
                            targetUnit.atkSpur += 5;
                            targetUnit.battleContext.healedHpByAttack = 5;
                        }
                        if (buffTotal >= 60) {
                            targetUnit.battleContext.isVantabeActivatable = true;
                        }
                    }
                    break;
                case Weapon.ChargingHorn:
                    if (!calcPotentialDamage) {
                        let count = 0;
                        if (this.__isThereBreakableStructureForEnemyIn2Spaces(targetUnit)) {
                            count = 3;
                        }
                        else {
                            count = this.__countAllyUnitsInClossWithOffset(targetUnit, 1);
                        }
                        if (count >= 1) {
                            let debuffAmount = Math.min(count * 2, 6);
                            enemyUnit.atkSpur -= debuffAmount;
                            enemyUnit.resSpur -= debuffAmount;
                        }
                        if (count >= 3) {
                            --enemyUnit.battleContext.followupAttackPriorityDecrement;
                        }
                    }
                    break;
                case Weapon.NifuruNoHyoka:
                    {
                        if (!targetUnit.isWeaponRefined) break;
                        let allies = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
                        if (allies.length >= 1) {
                            targetUnit.atkSpur += 5;
                            targetUnit.resSpur += 5;
                            targetUnit.atkSpur += Math.min(allies.length, 2) * 2;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 50) {
                                targetUnit.atkSpur += 5;
                                targetUnit.resSpur += 5;
                                let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false));
                                let atkMax = units.reduce((max, unit) => Math.max(max, unit.hasStatusEffect(StatusEffectType.Panic) ? 0 : unit.atkBuff), 0);
                                targetUnit.atkSpur += atkMax;
                            }
                        }
                    }
                    break;
                case Weapon.PunishmentStaff:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.MermaidBow:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.battleContext.refersMinOfDefOrRes = true;
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.EbonPirateClaw:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.CrossbonesClaw:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.spdSpur -= 6;
                        enemyUnit.defSpur -= 6;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.isDesperationActivated = true;
                        }
                    }
                    break;
                case PassiveB.YngviAscendant:
                    targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    break;
                case Weapon.HolyYewfelle:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    }
                    break;
                case Weapon.Ginnungagap:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        let isTomeOrStaff = enemyUnit.isTome || (enemyUnit.weaponType === WeaponType.Staff);
                        if (targetUnit.battleContext.initiatesCombat ||
                            (enemyUnit.battleContext.initiatesCombat && isTomeOrStaff)) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                        }
                    }
                    break;
                case Weapon.TigerSpirit:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case PassiveC.DomainOfIce:
                    if (this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        targetUnit.spdSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case Weapon.FrostbiteBreath:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.addAllSpur(-5);
                    }
                    break;
                case PassiveB.FlowRefresh3:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.DolphinDiveAxe:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.ShellpointLancePlus:
                case Weapon.TridentPlus:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case Weapon.RaydreamHorn:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.atkSpur += 6;
                        enemyUnit.atkSpur -= 6;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                    break;
                case Weapon.BrightmareHorn:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        if (targetUnit.isTransformed) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.Blizard:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            enemyUnit.spdSpur -= 4;
                            enemyUnit.resSpur -= 4;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 25) {
                                enemyUnit.addAllSpur(-4);
                                enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                                enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                                enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                                enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                            }
                        }
                    }
                    break;
                case Weapon.StoutTomahawk:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.Leiptr:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                            if (enemyUnit.battleContext.initiatesCombat) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                        }
                    }
                    break;
                case Weapon.MaskingAxe:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                        }
                    }
                    break;
                case Weapon.FuginNoMaran:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                    }
                    break;
                case Weapon.JaryuNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case PassiveA.DragonSkin2:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(6);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveA.LawsOfSacae2:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyIn2Spaces(targetUnit)) {
                        targetUnit.addAllSpur(6);
                    }
                    break;
                case Weapon.ProfessorialText:
                    if (targetUnit.battleContext.initiatesCombat
                        || this.__isThereAllyIn2Spaces(targetUnit)
                    ) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    }
                    break;
                case Weapon.SunflowerBowPlus:
                case Weapon.VictorfishPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.defSpur += 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.DivineSeaSpear:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        targetUnit.defSpur += 3;

                        enemyUnit.atkSpur -= 3;
                        enemyUnit.spdSpur -= 3;
                        enemyUnit.defSpur -= 3;
                    }
                    break;
                case Weapon.PeachyParfaitPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.resSpur += 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.SunshadeStaff:
                    if (!this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.Scadi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                    }
                    break;
                case Weapon.KenhimeNoKatana:
                    if (targetUnit.isWeaponRefined) {
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2) || targetUnit.battleContext.initiatesCombat) {
                            targetUnit.spdSpur += 5;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                        }
                    }
                    break;
                case Weapon.MuninNoMaran:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.addAllSpur(4);
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                                targetUnit.addAllSpur(4);
                            }
                        }
                    }
                    break;
                case Weapon.HolyGradivus:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                    break;
                case Weapon.Ladyblade:
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                    break;
                case Weapon.RohyouNoKnife:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.Pesyukado:
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.ObservantStaffPlus:
                    {
                        if (this.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                            targetUnit.addAllSpur(6);
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.FairFuryAxe:
                case Weapon.WeddingBellAxe:
                case Weapon.RoseQuartsBow:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.Gradivus:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.healedHpByAttack = 7;
                        }
                    }
                    break;
                case Weapon.Siegfried:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            enemyUnit.atkSpur -= 4;
                            enemyUnit.defSpur -= 4;
                            --enemyUnit.battleContext.followupAttackPriorityDecrement;
                        }
                    }
                    break;
                case Weapon.Raijinto:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.addAllSpur(4)
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.Ragnell:
                case Weapon.Alondite:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.BereftLance:
                    {
                        let allyCount = this.__countAlliesWithinSpecifiedSpaces(
                            targetUnit, 2);
                        let buffAmount = 0;
                        if (allyCount == 0) {
                            buffAmount = 6;
                        }
                        else if (allyCount == 1) {
                            buffAmount = 4;
                        }
                        else if (allyCount == 2) {
                            buffAmount = 2;
                        }
                        targetUnit.atkSpur += buffAmount;
                        targetUnit.defSpur += buffAmount;

                        if (allyCount <= 1) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.AxeOfDespair:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.TomeOfDespair:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                    }
                    break;
                case PassiveB.MurderousLion:
                    if (!this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.spdSpur -= 3;
                        enemyUnit.defSpur -= 3;
                        targetUnit.battleContext.invalidatesCounterattack = true;
                    }
                    break;
                case Weapon.AstraBlade:
                    targetUnit.battleContext.rateOfAtkMinusDefForAdditionalDamage = 0.5;
                    break;
                case PassiveB.ArmoredWall:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                        targetUnit.battleContext.reducesCooldownCount = true;
                        if (targetUnit.isTransformed
                            && !targetUnit.isOneTimeActionActivatedForPassiveB
                        ) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                        }
                    }
                    break;
                case Weapon.TwinCrestPower:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                        targetUnit.battleContext.followupAttackPriorityDecrement--;
                        enemyUnit.battleContext.followupAttackPriorityDecrement--;
                    }
                    break;
                case Weapon.HallowedTyrfing:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                        if (targetUnit.battleContext.initiatesCombat || enemyUnit.isRangedWeaponType()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.4, enemyUnit);
                        }
                    }
                    break;
                case PassiveC.FatalSmoke3:
                    targetUnit.battleContext.invalidatesHeal = true;
                    break;
                case Weapon.KyoufuArmars:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                            enemyUnit.atkSpur -= 5;
                            enemyUnit.defSpur -= 5;
                            targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.3;
                        }
                    }
                    break;
                case Weapon.FlowerLance:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.GrimasTruth:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 25) {
                                enemyUnit.addAllSpur(-4);
                                enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                                enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                                enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                                enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                            }
                        }
                    }
                    break;
                case Weapon.Shamsir:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                    }
                    break;
                case PassiveB.AtkDefNearTrace3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    break;
                case PassiveB.SpdDefNearTrace3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    break;
                case PassiveB.AtkDefFarTrace3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    break;
                case PassiveB.AtkResFarTrace3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    break;
                case PassiveB.SpdResFarTrace3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    break;
                case Weapon.BowOfFrelia:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.battleContext.additionalDamageOfSpecial += 7;
                        targetUnit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
                    }
                    break;
                case Weapon.TomeOfGrado:
                    if (!targetUnit.battleContext.initiatesCombat
                        || enemyUnit.snapshot.restHpPercentage == 100
                    ) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnResDebuff = true;
                        if (enemyUnit.attackRange == 2) {
                            targetUnit.battleContext.isAdvantageForColorless = true;
                        }
                    }
                    break;
                case Weapon.StaffOfRausten:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.LanceOfFrelia:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        if (targetUnit.battleContext.initiatesCombat) {
                            targetUnit.defSpur += 10;
                            targetUnit.resSpur += 10;
                        }
                    }
                    break;
                case Weapon.HotshotLance:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        let buffAmount = 4;
                        if (targetUnit.dragonflower == 3) {
                            buffAmount = 5;
                        }
                        else if (targetUnit.dragonflower == 4) {
                            buffAmount = 6;
                        }
                        else if (targetUnit.dragonflower == 5) {
                            buffAmount = 7;
                        }
                        targetUnit.addAllSpur(buffAmount);

                        if (targetUnit.dragonflower >= 3) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.TomeOfReglay:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case PassiveB.MoonTwinWing:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                    }
                    break;
                case PassiveB.SunTwinWing:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    }
                    break;
                case Weapon.SpringyBowPlus:
                case Weapon.SpringyAxePlus:
                case Weapon.SpringyLancePlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    }
                    break;
                case Weapon.LilacJadeBreath:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.GullinkambiEgg:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.TallHammer:
                    if (targetUnit.isWeaponRefined) {
                        // 周囲1マスにいない時の強化は別の処理で行っているため、ここでは除外
                        if (!this.__isSolo(targetUnit) && targetUnit.battleContext.initiatesCombat) {
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
                    break;
                case Weapon.Nagurufaru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            enemyUnit.atkSpur -= 4;
                            enemyUnit.resSpur -= 4;
                        }
                        if (!targetUnit.battleContext.initiatesCombat
                            && targetUnit.snapshot.restHpPercentage >= 70
                        ) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                    }
                    break;
                case Weapon.IcyFimbulvetr:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;

                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 3,
                            x => x.moveType == MoveType.Cavalry || x.moveType == MoveType.Flying)
                        ) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                            targetUnit.battleContext.healedHpByAttack = 5;
                        }
                    }
                    break;
                case Weapon.SteadfastLancePlus:
                case Weapon.SteadfastLance:
                case Weapon.SteadfastAxePlus:
                case Weapon.SteadfastAxe:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case PassiveB.FallenStar:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.8, enemyUnit);
                    }
                    break;
                case Weapon.Failnaught:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.UnboundBlade:
                case Weapon.UnboundBladePlus:
                    if (this.__isSolo(targetUnit)) {
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.SilesseFrost:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;

                        let partners = this.__getPartnersInSpecifiedRange(targetUnit, 2);
                        if (partners.length > 0) {
                            targetUnit.battleContext.attackCount = 2;
                        }
                    }
                    break;
                case Weapon.Audhulma:
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.Meisterschwert:
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                        if (targetUnit.battleContext.initiatesCombat) {
                            --enemyUnit.battleContext.followupAttackPriorityDecrement;
                        }
                    }
                    break;
                case Weapon.SpySongBow: {
                    if (!targetUnit.isWeaponSpecialRefined) break;
                    if (this.__isThereAnyPartnerPairsIn3Spaces(targetUnit)) {
                        targetUnit.addAllSpur(6);
                        targetUnit.battleContext.healedHpByAttack += 5;
                    }
                    break;
                }
                case Weapon.Thjalfi:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.battleContext.reductionRatioOfDamageReductionRatioExceptSpecial = 0.5;
                        targetUnit.addAllSpur(6);
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                    break;
                case Weapon.UnityBloomsPlus:
                case Weapon.AmityBloomsPlus:
                case Weapon.PactBloomsPlus:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                        targetUnit.battleContext.healedHpByAttack += 4;
                    }
                    break;
                case Weapon.SeaSearLance:
                case Weapon.LoyalistAxe:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case PassiveC.AdNearSave3:
                    if (targetUnit.battleContext.isSaviorActivated) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                    }
                    break;
                case PassiveC.ArFarSave3:
                    if (targetUnit.battleContext.isSaviorActivated) {
                        targetUnit.atkSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case PassiveC.DrNearSave3:
                    if (targetUnit.battleContext.isSaviorActivated) {
                        targetUnit.defSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case Weapon.AuroraBreath:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 6;
                        ++targetUnit.battleContext.followupAttackPriorityIncrement;
                    }
                    else {
                        targetUnit.defSpur += 6;
                        targetUnit.resSpur += 6;
                        --enemyUnit.battleContext.followupAttackPriorityDecrement;
                    }
                    break;
                case Weapon.IndignantBow:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.atkSpur += 6;
                        enemyUnit.atkSpur -= 6;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                    }
                    break;
                case Weapon.Grafcalibur:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.Forusethi:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.initiatesCombat
                            && targetUnit.snapshot.restHpPercentage >= 25
                        ) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                                targetUnit.battleContext.invalidateAllOwnDebuffs();
                                targetUnit.battleContext.invalidatesAtkBuff = true;
                                targetUnit.battleContext.invalidatesSpdBuff = true;
                            }
                        }
                    }
                    break;
                case Weapon.SpringtimeStaff:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.battleContext.initiatesCombat
                            || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.resSpur += 5;
                        }
                    }
                    break;
                case Weapon.ArdensBlade:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 4;
                            targetUnit.defSpur += 6;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.ResolvedFang:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.defSpur += 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.RefreshedFang:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.spdSpur += 5;
                        enemyUnit.spdSpur -= 5;
                    }
                    break;
                case Weapon.RenewedFang:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                        (u) =>
                            targetUnit.partnerHeroIndex === u.heroIndex ||
                            targetUnit.heroIndex === u.partnerHeroIndex)) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.spdSpur -= 6;
                        targetUnit.battleContext.increaseCooldownCountForBoth();
                    }
                    break;
                case Weapon.StudiedForblaze:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.ReindeerBowPlus:
                case Weapon.CandyCanePlus:
                    if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.Hrist:
                    if (targetUnit.snapshot.restHpPercentage <= 99) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.TomeOfFavors:
                    if (!isWeaponTypeBeast(enemyUnit.weaponType)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.PurifyingBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.addAllSpur(4);
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    break;
                case Weapon.ObsidianLance:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                        targetUnit.battleContext.followupAttackPriorityIncrement++;
                    }
                    break;
                case Weapon.TomeOfStorms:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.Lyngheior:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                    break;
                case Weapon.Aureola:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.resSpur += 5;
                        targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                    }
                    break;
                case Weapon.TigerRoarAxe:
                    if (targetUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.addAllSpur(5);
                        if (enemyUnit.snapshot.restHpPercentage === 100) {
                            targetUnit.battleContext.followupAttackPriorityIncrement++;
                        }
                    }
                    break;
                case Weapon.Areadbhar:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.DarkCreatorS:
                    if (!calcPotentialDamage && !targetUnit.isOneTimeActionActivatedForWeapon) {
                        let count = this.__countUnit(targetUnit.groupId, x => x.hpPercentage >= 90);
                        let buff = Math.min(count * 2, 6);
                        targetUnit.atkSpur += buff;
                        targetUnit.defSpur += buff;
                    }
                    break;
                case Weapon.SpearOfAssal:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                    }
                    break;
                case Weapon.Thunderbrand:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.EffiesLance:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
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
                    break;
                case Weapon.PaleBreathPlus:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case Weapon.JokersWild:
                    {
                        let atk = 0;
                        let spd = 0;
                        let def = 0;
                        let res = 0;
                        let foundUnit = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                            atk = Math.max(atk, unit.getAtkInPrecombat());
                            spd = Math.max(spd, unit.getSpdInPrecombat());
                            def = Math.max(def, unit.getDefInPrecombat());
                            res = Math.max(res, unit.getResInPrecombat());
                            foundUnit = true;
                        }
                        if (foundUnit) {
                            targetUnit.atkSpur += atk - targetUnit.getAtkInPrecombat();
                            targetUnit.spdSpur += spd - targetUnit.getSpdInPrecombat();
                            targetUnit.defSpur += def - targetUnit.getDefInPrecombat();
                            targetUnit.resSpur += res - targetUnit.getResInPrecombat();
                        }
                    }
                    break;
                case PassiveB.SlickFighter3:
                    if (targetUnit.snapshot.restHpPercentage >= 25 && enemyUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.BlackfireBreathPlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesResBuff = true;
                    }
                    break;
                case PassiveA.Dragonscale:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.FlameLance:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.TalreganAxe:
                    if (targetUnit.battleContext.initiatesCombat
                        || (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                    ) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.GiltGoblet:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage === 100) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.CourtlyMaskPlus:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.CourtlyBowPlus:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case Weapon.CourtlyCandlePlus:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    break;
                case PassiveB.CraftFighter3:
                    if (!targetUnit.battleContext.initiatesCombat
                        && targetUnit.snapshot.restHpPercentage >= 25
                    ) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                        ++targetUnit.battleContext.followupAttackPriorityIncrement;
                    }
                    break;
                case Weapon.Garumu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.addAllSpur(5);
                            targetUnit.battleContext.healedHpByAttack += 7;
                        }
                        if (targetUnit.hasPositiveStatusEffect()) {
                            targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.PrimordialBreath:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.ArmorsmasherPlus:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.moveType == MoveType.Armor) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.KeenGronnwolfPlus:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.moveType == MoveType.Cavalry) {
                            targetUnit.battleContext.invalidateAllBuffs();
                        }
                    }
                    break;
                case Weapon.FlowerHauteclere:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.MoonGradivus:
                    targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    break;
                case Weapon.WindParthia:
                    if (targetUnit.battleContext.initiatesCombat
                        || (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                    ) {
                        targetUnit.addAllSpur(5);
                        targetUnit.battleContext.maxHpRatioToHealBySpecial += 0.5;
                    }
                    break;
                case Weapon.DarkSpikesT:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.DeckSwabberPlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.GateAnchorAxe:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.FlowingLancePlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.HelmBowPlus:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.SkyPirateClaw:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.atkSpur += 5;
                        enemyUnit.atkSpur -= 5;
                    }
                    break;
                case Weapon.ShirokiChiNoNaginata:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    break;
                case Weapon.BladeOfShadow:
                case Weapon.SpearOfShadow:
                    if (!targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.SunsPercussors:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                        || enemyUnit.snapshot.restHpPercentage == 100
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.RauarRabbitPlus:
                case Weapon.BlarRabbitPlus:
                case Weapon.ConchBouquetPlus:
                case Weapon.MelonFloatPlus:
                case Weapon.HiddenThornsPlus:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.atkSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.StarpointLance:
                    if (!targetUnit.isOneTimeActionActivatedForWeapon) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.ShinenNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage
                            && targetUnit.snapshot.restHpPercentage >= 25
                            && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                        ) {
                            targetUnit.addAllSpur(5);
                            targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        }
                    }
                    break;
                case Weapon.StalwartSword:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                            targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                            targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                        }
                    }
                    break;
                case Weapon.SnipersBow:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                    }
                    break;
                case Weapon.ApotheosisSpear:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.BridesFang:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                    }
                    break;
                case Weapon.JukishiNoJuso:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }

                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;

                case Weapon.KarenNoYumi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                            targetUnit.defSpur += 4;
                        }
                    }
                    break;
                case Weapon.KurokiChiNoTaiken:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.BrutalBreath:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
                        let spur = 0;
                        if (count == 0) {
                            spur = 5;
                        } else if (count == 1) {
                            spur = 3;
                        } else if (count == 2) {
                            spur = 1;
                        }
                        targetUnit.addAllSpur(spur);

                        if (count <= 1) {
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.DarkScripture:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.resSpur -= 6;
                    }
                    break;
                case Weapon.Aymr:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.AkaiRyukishiNoOno:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.WindsOfChange:
                    if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.TenmaNoNinjinPlus:
                    if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) == TriangleAdvantage.Advantageous) {
                        targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                    }
                    break;
                case Weapon.SpendthriftBowPlus:
                    targetUnit.atkSpur += 7;
                    enemyUnit.atkSpur -= 7;
                    this.__writeDamageCalcDebugLog(`お大尽の弓により${targetUnit.getNameWithGroup()}の攻撃+7、${enemyUnit.getNameWithGroup()}の攻撃-7`);
                    break;
                case PassiveA.AtkSpdBond4:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnSpdDebuff = true;
                    }
                    break;
                case PassiveA.AtkDefBond4:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case PassiveA.AtkResBond4:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnResDebuff = true;
                    }
                    break;
                case Weapon.OgonNoFolkPlus:
                case Weapon.NinjinhuNoSosyokuPlus:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.invalidatesOwnAtkDebuff = true;
                        targetUnit.battleContext.invalidatesOwnDefDebuff = true;
                    }
                    break;
                case Weapon.VezuruNoYoran:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.SuyakuNoKen:
                    if (targetUnit.maxHpWithSkills > enemyUnit.snapshot.restHp) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.GrayNoHyouken:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.addAllSpur(3);
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case Weapon.Randgrior:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.Rigarublade:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        if (targetUnit.isWeaponRefined) {
                            targetUnit.atkSpur += 3;
                            targetUnit.spdSpur += 3;
                        }
                        else {
                            targetUnit.atkSpur += 2;
                            targetUnit.spdSpur += 2;
                        }
                    }
                    break;
                case Weapon.SeikenThirufingu:
                    if (isWeaponTypeTome(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.5, enemyUnit);
                    }
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 50) {
                                targetUnit.atkSpur += 5;
                                targetUnit.defSpur += 5;
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                        }
                    }
                    break;
                case Weapon.HikariNoKen:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.snapshot.restHpPercentage == 100) {
                            targetUnit.spdSpur += 4;
                            targetUnit.defSpur += 4;
                        }
                    }
                    break;
                case Weapon.OukeNoKen:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.battleContext.initiatesCombat
                            || (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                        ) {
                            targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 25) {
                                targetUnit.addAllSpur(5);
                            }
                        }
                    }
                    else if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.Fensariru:
                    if (targetUnit.isWeaponRefined) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.Roputous:
                    if (!enemyUnit.isWeaponEffectiveAgainst(EffectiveType.Dragon)) {
                        enemyUnit.atkSpur -= 6;
                    }
                    break;
                case Weapon.Buryunhirude:
                    if (isWeaponTypeTome(enemyUnit.weaponType)) {
                        targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                    }
                    break;
                case Weapon.Seini:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.isRangedWeaponType()) {
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (targetUnit.snapshot.restHpPercentage >= 50) {
                                targetUnit.atkSpur += 5;
                                targetUnit.resSpur += 5;
                                targetUnit.battleContext.followupAttackPriorityIncrement++;
                            }
                        }
                    }
                    else {
                        if (enemyUnit.moveType == MoveType.Armor || enemyUnit.moveType == MoveType.Cavalry) {
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            }
                        }
                    }
                    break;
                case Weapon.Gureipuniru:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.atkSpur += 3;
                        targetUnit.spdSpur += 3;
                        if (targetUnit.isWeaponSpecialRefined) {
                            enemyUnit.addAllSpur(-4);
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    break;
                case Weapon.Ivarudhi:
                    if (targetUnit.isWeaponRefined) {
                        if (enemyUnit.snapshot.restHpPercentage >= 75) {
                            targetUnit.atkSpur += 3;
                            targetUnit.spdSpur += 3;
                            targetUnit.resSpur += 3;
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                enemyUnit.atkSpur -= 5;
                                enemyUnit.resSpur -= 5;
                            }
                        }
                    }
                    else {
                        if (enemyUnit.snapshot.restHpPercentage == 100) {
                            targetUnit.atkSpur += 3;
                            targetUnit.spdSpur += 3;
                        }
                    }
                    break;
                case Weapon.Arrow:
                    if (targetUnit.getAtkInPrecombat() <= enemyUnit.getAtkInPrecombat() - 5) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.Naga:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeBreath(enemyUnit.weaponType)) {
                            targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                            targetUnit.battleContext.canCounterattackToAllDistance = true;
                        }
                    }
                    break;
                case Weapon.KiriNoBreath:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                            x.weaponType == WeaponType.Sword || isWeaponTypeBreath(x.weaponType))
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                    }
                    break;
                case Weapon.ShikkyuMyurugure:
                case Weapon.MizuNoHimatsu:
                    if (this.__isAllyCountIsGreaterThanEnemyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.MugenNoSyo:
                    if (this.__isNextToOtherUnits(targetUnit)) {
                        enemyUnit.addAllSpur(-4);
                    }
                    break;
                case Weapon.Syurugu:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.Rifia:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.ShirokiNoTyouken:
                case Weapon.ShirokiNoTyokusou:
                case Weapon.ShirokiNoTansou:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                            x.moveType == MoveType.Flying) >= 2
                        ) {
                            targetUnit.addAllSpur(3);
                        }
                    }
                    break;
                case Weapon.OgonNoTanken:
                    if (targetUnit.isSpecialCharged) {
                        targetUnit.addAllSpur(3);
                    }
                    break;
                case Weapon.OkamijoouNoKiba:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
                        let amount = Math.min(6, count * 2);
                        targetUnit.atkSpur += amount;
                        targetUnit.spdSpur += amount;
                    }
                    break;
                case Weapon.GuradoNoSenfu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                            targetUnit.spdSpur += 5;
                            targetUnit.defSpur += 5;
                        }
                    }
                    break;
                case Weapon.FeruniruNoYouran:
                    if (targetUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.HisenNoNinjinYariPlus:
                case Weapon.HaruNoYoukyuPlus:
                    if (enemyUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.addAllSpur(2);
                    }
                    break;
                case Weapon.Saferimuniru:
                    if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                        let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                        let diffHalf = Math.floor(diff * 0.5);
                        let amount = Math.max(0, Math.min(8, diffHalf));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case Weapon.Erudofurimuniru:
                    if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                        let diff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                        let diffHalf = Math.floor(diff * 0.5);
                        let amount = Math.max(0, Math.min(8, diffHalf));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.spdSpur -= amount;
                    }
                    break;
                case Weapon.BoranNoBreath:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x => true);
                        if (count == 0) {
                            targetUnit.addAllSpur(6);
                        }
                        else if (count == 1) {
                            targetUnit.addAllSpur(4);
                        }
                        else if (count == 2) {
                            targetUnit.addAllSpur(2);
                        }
                    }
                    break;
                case Weapon.AsuNoSEikishiNoKen:
                    if (!enemyUnit.isBuffed) {
                        enemyUnit.atkSpur += 6;
                        enemyUnit.defSpur += 6;
                    }
                    break;
                case Weapon.Flykoogeru:
                    if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                        x.getDefInPrecombat() > targetUnit.getDefInPrecombat())
                    ) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.SyuryouNoEijin:
                    {
                        let atk = false;
                        let spd = false;
                        let def = false;
                        let res = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
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
                        if (atk) { targetUnit.atkSpur += 5; }
                        if (spd) { targetUnit.spdSpur += 5; }
                        if (def) { targetUnit.defSpur += 5; }
                        if (res) { targetUnit.resSpur += 5; }
                    }
                    break;
                case Weapon.BerukaNoSatsufu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 50) {
                            enemyUnit.atkSpur -= 4;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.SarieruNoOkama:
                    if (enemyUnit.isBuffed || enemyUnit.isMobilityIncreased) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.MagetsuNoSaiki:
                    if (this.isOddTurn || enemyUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.TsubakiNoKinnagitou:
                    if (targetUnit.getAtkInPrecombat() >= enemyUnit.getAtkInPrecombat() - 3) {
                        targetUnit.addAllSpur(3);
                    }
                    break;
                case Weapon.SyugosyaNoKyofu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 3;
                        enemyUnit.defSpur -= 3;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.ByakuyaNoRyuuseki:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 3;
                        enemyUnit.spdSpur -= 3;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesSpdBuff = true;
                    }
                    break;
                case Weapon.YumikishiNoMiekyu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 4;
                        enemyUnit.defSpur -= 4;
                    }
                    break;
                case Weapon.KishisyogunNoHousou:
                    if (enemyUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.PieriNoSyousou:
                    if (targetUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.Tangurisuni:
                    if (targetUnit.isBuffed || targetUnit.isMobilityIncreased) {
                        targetUnit.addAllSpur(3);
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.ChisouGeiborugu:
                    if (enemyUnit.moveType == MoveType.Infantry
                        || enemyUnit.moveType == MoveType.Armor
                        || enemyUnit.moveType == MoveType.Cavalry
                    ) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case Weapon.KokukarasuNoSyo:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                            this.__writeDamageCalcDebugLog("黒鴉の書の効果が発動、敵の攻魔-6、奥義カウント変動量を-1");
                            enemyUnit.atkSpur -= 6;
                            enemyUnit.resSpur -= 6;
                            targetUnit.battleContext.reducesCooldownCount = true;
                        }
                    }
                    break;
                case Weapon.ThiamoNoAisou:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.snapshot.restHpPercentage >= 70) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                    }
                    break;
                case Weapon.GeneiBattleAxe:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.defSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.BaraNoYari:
                    if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                        enemyUnit.atkSpur -= 6;
                        enemyUnit.defSpur -= 6;
                    }
                    break;
                case Weapon.AiNoSaiki:
                    if (targetUnit.isBuffed || targetUnit.snapshot.restHpPercentage >= 70) {
                        targetUnit.atkSpur += Math.floor(enemyUnit.getDefInPrecombat() * 0.25);
                        enemyUnit.atkSpur -= Math.floor(enemyUnit.getResInPrecombat() * 0.25);
                    }
                    break;
                case Weapon.RazuwarudoNoMaiken:
                    {
                        let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3, x =>
                            x.buffTotal >= 10);
                        if (count >= 2) {
                            targetUnit.atkSpur += 3;
                            targetUnit.defSpur += 3;
                        }
                    }
                    break;
                case Weapon.ChichiNoSenjutsusyo:
                    if (targetUnit.getEvalResInPrecombat() > enemyUnit.getEvalResInPrecombat()) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case PassiveB.Tenmakoku3:
                    if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 7) {
                        let resDiff = targetUnit.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
                        let amount = Math.max(0, Math.min(7, Math.floor(resDiff * 0.5)));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case PassiveB.WyvernFlight3:
                    if (targetUnit.getEvalSpdInPrecombat() >= enemyUnit.getEvalSpdInPrecombat() - 10) {
                        let defDiff = targetUnit.getEvalDefInPrecombat() - enemyUnit.getEvalDefInPrecombat();
                        let amount = Math.max(0, Math.min(7, Math.floor(defDiff * 0.5)));
                        enemyUnit.atkSpur -= amount;
                        enemyUnit.defSpur -= amount;
                    }
                    break;
                case Weapon.AsameiNoTanken:
                    if (!enemyUnit.snapshot.isRestHpFull) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        if (!targetUnit.battleContext.initiatesCombat) {
                            targetUnit.battleContext.isVantabeActivatable = true;
                        }
                    }
                    break;
                case Weapon.Jikurinde:
                    if (targetUnit.isWeaponSpecialRefined) {
                        let atk = 0;
                        let spd = 0;
                        let def = 0;
                        let res = 0;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
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
                    break;
                case Weapon.RaikenJikurinde:
                    if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.defSpur += 3;
                        targetUnit.resSpur += 3;
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.RyukenFalcion:
                    if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.Vorufuberugu:
                    if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(targetUnit, enemyUnit, calcPotentialDamage)) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.DevilAxe:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.ZeroNoGyakukyu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.SyunsenAiraNoKen:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.addAllSpur(4);
                                targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.2, enemyUnit);
                            }
                        }
                    }
                    else {
                        DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.WingSword:
                case Weapon.Romfire:
                    if (targetUnit.isWeaponSpecialRefined) {
                        DamageCalculatorWrapper.__applyFlashingBladeSkill(targetUnit, enemyUnit);
                    }
                    break;
                case Weapon.KageroNoGenwakushin:
                    if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                    }
                    break;
                case Weapon.Death:
                    targetUnit.addAllSpur(4);
                    break;
                case Weapon.RebbekkaNoRyoukyu:
                    if (targetUnit.isBuffed) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case Weapon.UminiUkabuItaPlus:
                case Weapon.NangokuNoKajitsuPlus:
                    if (targetUnit.isBuffed) {
                        targetUnit.atkSpur += 4;
                        targetUnit.resSpur += 4;
                    }
                    break;
                case Weapon.SunahamaNoScopPlus:
                case Weapon.SunahamaNoKuwaPlus:
                    if (targetUnit.isBuffed) {
                        targetUnit.atkSpur += 4;
                        targetUnit.defSpur += 4;
                    }
                    break;
                case Weapon.SakanaWoTsuitaMori:
                case Weapon.SakanaWoTsuitaMoriPlus:
                case Weapon.SuikaWariNoKonbo:
                case Weapon.SuikaWariNoKonboPlus:
                case Weapon.KorigashiNoYumi:
                case Weapon.KorigashiNoYumiPlus:
                case Weapon.Kaigara:
                case Weapon.KaigaraPlus:
                    if (targetUnit.snapshot.isRestHpFull) {
                        targetUnit.addAllSpur(2);
                    }
                    break;
                case Weapon.Kasaburanka:
                case Weapon.KasaburankaPlus:
                case Weapon.Grathia:
                case Weapon.GrathiaPlus:
                case Weapon.AoNoPresentBukuro:
                case Weapon.AoNoPresentBukuroPlus:
                case Weapon.MidoriNoPresentBukuro:
                case Weapon.MidoriNoPresentBukuroPlus:
                case Weapon.YamaNoInjaNoSyo:
                    if (enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.SeisyoNaga:
                    targetUnit.battleContext.invalidateAllBuffs();
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.invalidatesReferenceLowerMit = true;
                        if (targetUnit.getEvalResInPrecombat() >= enemyUnit.getEvalResInPrecombat() + 3) {
                            targetUnit.addAllSpur(3);
                        }
                    }
                    break;
                case Weapon.Forukuvangu:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.restHpPercentage <= 80) {
                            targetUnit.atkSpur += 7;
                            targetUnit.defSpur += 7;
                        }
                    }
                    break;
                case Weapon.KizokutekinaYumi:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (targetUnit.hp > enemyUnit.hp) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.RunaNoEiken:
                    if (enemyUnit.getAtkInPrecombat() >= targetUnit.getAtkInPrecombat() + 3) {
                        targetUnit.addAllSpur(3);
                    }
                    break;
                case Weapon.Sekuvaveku:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                    }
                    break;
                case PassiveB.HikariToYamito:
                    enemyUnit.addAllSpur(-2);
                    targetUnit.battleContext.invalidateAllBuffs();
                    targetUnit.battleContext.invalidatesReferenceLowerMit = true;

                    break;
                case Weapon.ShiseiNaga:
                    if (targetUnit.getAtkInPrecombat() > enemyUnit.getAtkInPrecombat()) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.Uchikudakumono:
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                    break;
                case Weapon.FerisiaNoKorizara:
                    targetUnit.battleContext.refersMinOfDefOrRes = true;
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (isWeaponTypeTome(enemyUnit.weaponType)) {
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                    }
                    break;
                case PassiveA.MadoNoYaiba3:
                    if (!calcPotentialDamage) {
                        let isActivated = false;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 1, false)) {
                            if (isWeaponTypeTome(unit.weaponType)) {
                                isActivated = true;
                                break;
                            }
                        }
                        if (isActivated) {
                            targetUnit.battleContext.refersMinOfDefOrRes = true;
                        }
                    }
                    break;
                case PassiveA.SeimeiNoGoka3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.atkSpur += 6; }
                    break;
                case PassiveA.SeimeiNoShippu3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.spdSpur += 6; }
                    break;
                case PassiveA.SeimeiNoDaichi3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.defSpur += 6; }
                    break;
                case PassiveA.SeimeiNoSeisui3:
                    if (targetUnit.hp >= enemyUnit.hp + 3) { targetUnit.resSpur += 6; }
                    break;
                case Weapon.GaeBolg:
                    if (enemyUnit.moveType == MoveType.Armor
                        || enemyUnit.moveType == MoveType.Cavalry
                        || enemyUnit.moveType == MoveType.Infantry
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        let units = this.enumerateUnitsInTheSameGroupOnMap(targetUnit);
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
                    break;
                case Weapon.Ragnarok:
                    if (isWeaponSpecialRefined(targetUnit.weaponRefinement)) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        if (targetUnit.snapshot.restHpPercentage <= 80) {
                            targetUnit.atkSpur += 7;
                            targetUnit.spdSpur += 7;
                        }
                    }
                    else {
                        if (targetUnit.snapshot.isRestHpFull) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                    }
                    break;
                case Weapon.HokenSophia:
                    if (!targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.isRestHpFull) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    else {
                        targetUnit.addAllSpur(4);
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (!targetUnit.snapshot.isRestHpFull || !enemyUnit.snapshot.isRestHpFull) {
                                targetUnit.addAllSpur(4);
                                targetUnit.battleContext.healedHpByAttack += 7;
                            }
                        }
                    }

                    break;
                case Weapon.ImbuedKoma:
                    if (targetUnit.isSpecialCharged) {
                        targetUnit.addAllSpur(5);
                    }
                    break;
                case Weapon.Marute:
                    if (targetUnit.isWeaponRefined) {
                        if (!targetUnit.battleContext.initiatesCombat
                            && targetUnit.snapshot.restHpPercentage >= 25) {
                            targetUnit.battleContext.invalidateAllOwnDebuffs();
                        }
                    }
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (!targetUnit.battleContext.initiatesCombat
                            || enemyUnit.snapshot.restHpPercentage == 100) {
                            enemyUnit.atkSpur -= 6;
                            enemyUnit.defSpur -= 6;
                        }
                    }
                    break;
                case Weapon.HarukazeNoBreath:
                    if ((!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2))
                        || targetUnit.isBuffed
                    ) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        enemyUnit.atkSpur -= 6;
                    }
                    break;
                case Weapon.LarceisEdge:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                        || enemyUnit.snapshot.isRestHpFull
                    ) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case Weapon.Mulagir:
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
                    break;
                case Weapon.Ifingr:
                    if (!calcPotentialDamage && this.__isThereAllyInSpecifiedSpaces(targetUnit, 3)) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                    }
                    break;
                case Weapon.BookOfShadows:
                    if (this.__isNextToOtherUnits(targetUnit)) {
                        enemyUnit.addAllSpur(-4);
                    }
                    break;
                case Weapon.FellBreath:
                    if (enemyUnit.snapshot.restHpPercentage < 100) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
                case Weapon.TaguelFang:
                    {
                        if (!this.__isNextToOtherUnitsExceptDragonAndBeast(targetUnit)) {
                            targetUnit.addAllSpur(3);
                        }
                    }
                    break;

                case Weapon.SnowsGrace:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
                    }
                    break;
                case Weapon.DivineBreath:
                    if (!calcPotentialDamage) {
                        let statusPlus = 0;
                        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
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
                    break;
                case PassiveA.AtkSpdPush3:
                    if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.spdSpur += 5; }
                    break;
                case PassiveA.AtkDefPush3:
                    if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.defSpur += 5; }
                    break;
                case PassiveA.AtkResPush3:
                    if (targetUnit.snapshot.isRestHpFull) { targetUnit.atkSpur += 5; targetUnit.resSpur += 5; }
                    break;
                case PassiveA.AtkDefPush4:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
                    break;
                case PassiveA.AtkResPush4:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case PassiveA.AtkSpdPush4:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
                    break;
                case PassiveA.DistantPressure:
                    if (targetUnit.snapshot.restHpPercentage >= 25) { targetUnit.spdSpur += 5; }
                    break;
                case PassiveA.BrazenAtkSpd3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.spdSpur += 7; }
                    break;
                case PassiveA.BrazenAtkSpd4:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 9; targetUnit.spdSpur += 10; }
                    break;
                case PassiveA.BrazenAtkDef3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.defSpur += 7; }
                    break;
                case PassiveA.BrazenAtkRes3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.atkSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case PassiveA.BrazenDefRes3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.defSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case PassiveA.BrazenSpdDef3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.defSpur += 7; }
                    break;
                case PassiveA.BrazenSpdRes3:
                    if (targetUnit.snapshot.restHpPercentage <= 80) { targetUnit.spdSpur += 7; targetUnit.resSpur += 7; }
                    break;
                case Weapon.KurooujiNoYari:
                    if (targetUnit.isWeaponSpecialRefined) {
                        enemyUnit.atkSpur -= 3;
                        enemyUnit.defSpur -= 3;
                        targetUnit.battleContext.invalidatesAtkBuff = true;
                        targetUnit.battleContext.invalidatesDefBuff = true;
                    }
                    break;
                case PassiveB.LullAtkDef3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                    break;
                case PassiveB.LullAtkSpd3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.spdSpur -= 3;
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    break;
                case PassiveB.LullAtkRes3:
                    enemyUnit.atkSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    targetUnit.battleContext.invalidatesAtkBuff = true;
                    targetUnit.battleContext.invalidatesResBuff = true;
                    break;
                case PassiveB.LullSpdDef3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.defSpur -= 3;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    targetUnit.battleContext.invalidatesDefBuff = true;
                    break;
                case PassiveB.LullSpdRes3:
                    enemyUnit.spdSpur -= 3;
                    enemyUnit.resSpur -= 3;
                    targetUnit.battleContext.invalidatesSpdBuff = true;
                    targetUnit.battleContext.invalidatesResBuff = true;
                    break;
                case PassiveB.BeokuNoKago:
                    if (enemyUnit.moveType == MoveType.Cavalry || enemyUnit.moveType == MoveType.Flying) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveB.KyokaMukoKinkyori3:
                    if (enemyUnit.isMeleeWeaponType()) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveB.KyokaMukoEnkyori3:
                    if (enemyUnit.isRangedWeaponType()) {
                        targetUnit.battleContext.invalidateAllBuffs();
                    }
                    break;
                case PassiveB.SpecialFighter3:
                    if (targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case Weapon.KabochaNoOno:
                case Weapon.KabochaNoOnoPlus:
                case Weapon.KoumoriNoYumi:
                case Weapon.KoumoriNoYumiPlus:
                case Weapon.KajuNoBottle:
                case Weapon.KajuNoBottlePlus:
                case Weapon.CancelNoKenPlus:
                case Weapon.CancelNoYariPlus:
                case Weapon.CancelNoOnoPlus:
                case Weapon.CancelNoOno:
                    targetUnit.battleContext.reducesCooldownCount = true;
                    break;
                case PassiveB.Cancel1:
                    if (targetUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case PassiveB.Cancel2:
                    if (targetUnit.snapshot.restHpPercentage >= 90) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
                case PassiveB.Cancel3:
                    if (targetUnit.snapshot.restHpPercentage >= 80) {
                        targetUnit.battleContext.reducesCooldownCount = true;
                    }
                    break;
            }
        }
    }

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
            if (i == units.length) {
                break;
            }

            total += units[i].buffTotal;
        }
        return total;
    }

    static __calcFixedSpecialAddDamage(targetUnit, enemyUnit) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.MoonlightBangle: {
                    let ratio = 0.2 + targetUnit.maxSpecialCount * 0.1;
                    targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(enemyUnit.getDefInCombat(targetUnit) * ratio);
                }
                    break;
                case PassiveB.RunaBracelet:
                    targetUnit.battleContext.additionalDamageOfSpecial += Math.trunc(enemyUnit.getDefInCombat(targetUnit) * 0.5);
                    break;
                case Weapon.MakenMistoruthin:
                    if (enemyUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 7;
                    }
                    break;
                case Weapon.ResolvedFang:
                case Weapon.RenewedFang:
                case Weapon.JinroMusumeNoTsumekiba:
                case Weapon.TrasenshiNoTsumekiba:
                case Weapon.JinroOuNoTsumekiba:
                case Weapon.OkamijoouNoKiba:
                case Weapon.BridesFang:
                case Weapon.GroomsWings:
                    if (targetUnit.isTransformed) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
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
                    targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    break;
                case Weapon.Shamsir:
                    targetUnit.battleContext.additionalDamageOfSpecial += 7;
                    break;
                case Weapon.RunaNoEiken:
                case Weapon.Otokureru:
                case Weapon.MumeiNoIchimonNoKen:
                case Weapon.SyaniNoSeisou:
                case Weapon.DevilAxe:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
                case PassiveB.Ikari3:
                    if (targetUnit.restHpPercentage <= 75) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 10;
                    }
                    break;
                case PassiveB.Spurn3:
                    if (targetUnit.restHpPercentage <= 75) {
                        targetUnit.battleContext.additionalDamageOfSpecial += 5;
                    }
                    break;
            }
        }
    }

    __applySkillEffectRelatedToEnemyStatusEffects(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
            if (Math.abs(targetUnit.posX - unit.posX) <= 1) {
                // 縦3列以内
                switch (unit.weapon) {
                    case Weapon.FlowerOfEase:
                        if (targetUnit.hasNegativeStatusEffect()) {
                            targetUnit.atkSpur -= 3;
                            targetUnit.defSpur -= 3;
                            targetUnit.resSpur -= 3;
                        }
                        break;
                }
            }
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveA.AtkSpdCatch4:
                    if (enemyUnit.snapshot.restHpPercentage == 100
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 7;
                        targetUnit.spdSpur += 7;

                        if (enemyUnit.snapshot.restHpPercentage == 100
                            && enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.atkSpur += 2;
                            targetUnit.spdSpur += 2;
                        }
                    }
                    break;
                case PassiveA.AtkDefCatch4:
                    if (enemyUnit.snapshot.restHpPercentage == 100
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 7;
                        targetUnit.defSpur += 7;

                        if (enemyUnit.snapshot.restHpPercentage == 100
                            && enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.atkSpur += 2;
                            targetUnit.defSpur += 2;
                        }
                    }
                    break;
                case PassiveA.DefResCatch4:
                    if (enemyUnit.snapshot.restHpPercentage == 100
                        || enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.defSpur += 7;
                        targetUnit.resSpur += 7;

                        if (enemyUnit.snapshot.restHpPercentage == 100
                            && enemyUnit.hasNegativeStatusEffect()
                        ) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                        }
                    }
                    break;
                case Weapon.FukenFalcion:
                    if (targetUnit.isWeaponRefined) {
                        if (targetUnit.snapshot.restHpPercentage < 100
                            || targetUnit.hasPositiveStatusEffect(enemyUnit)
                        ) {
                            targetUnit.addAllSpur(5);
                        }

                        if (targetUnit.isWeaponSpecialRefined) {
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.defSpur += 5;
                                --enemyUnit.battleContext.followupAttackPriorityDecrement;
                            }
                        }
                    }
                    else {
                        if (targetUnit.snapshot.restHpPercentage < 100) {
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
                case Weapon.JoyfulVows:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.resSpur += 6;
                    }
                    break;
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
                case Weapon.LevinDagger:
                    if (enemyUnit.hasNegativeStatusEffect()
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                        targetUnit.resSpur += 5;
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
                case PassiveB.KillingIntent:
                    if (enemyUnit.snapshot.restHpPercentage < 100 || enemyUnit.hasNegativeStatusEffect()) {
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.resSpur -= 5;
                    }
                    break;
                case Weapon.WeirdingTome:
                    if (targetUnit.isWeaponSpecialRefined) {
                        if (enemyUnit.hasNegativeStatusEffect()) {
                            targetUnit.addAllSpur(4);
                        }
                    }
                    break;
                case Weapon.ChaosManifest:
                    if (enemyUnit.hasNegativeStatusEffect()) {
                        targetUnit.atkSpur += 6;
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
                            || !targetUnit.snapshot.isRestHpFull
                        ) {
                            targetUnit.addAllSpur(5);
                        }
                    }
                    break;
                case PassiveB.ShisyaNoChojiriwo:
                    if (targetUnit.snapshot.restHpPercentage >= 50 || targetUnit.hasNegativeStatusEffect()) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case Weapon.HigaimosoNoYumi:
                    if (targetUnit.hasNegativeStatusEffect()
                        || !targetUnit.snapshot.isRestHpFull
                    ) {
                        targetUnit.atkSpur += 5;
                        targetUnit.spdSpur += 5;
                    }
                    break;
                case Weapon.MaryuNoBreath:
                    if (targetUnit.hasNegativeStatusEffect()
                        || !targetUnit.snapshot.isRestHpFull
                    ) {
                        targetUnit.addAllSpur(4);
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                    }
                    break;
                case Weapon.Fimbulvetr:
                    if (targetUnit.snapshot.restHpPercentage < 100 || targetUnit.hasNegativeStatusEffect()) {
                        targetUnit.battleContext.invalidateAllOwnDebuffs();
                        targetUnit.addAllSpur(4);
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
                        if (targetUnit.snapshot.restHpPercentage < 100
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
    }

    __applySkillEffectForAttackerAndDefenderFromAllies(atkUnit, defUnit, calcPotentialDamage) {
        if (atkUnit.canDisableEnemySpursFromAlly()) {
            return;
        }
        if (calcPotentialDamage) {
            return;
        }

        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(defUnit, 2)) {
            for (let skillId of allyUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.SunshadeStaff:
                        defUnit.battleContext.increaseCooldownCountForDefense = true;
                        defUnit.atkSpur += 6;
                        break;
                    case Weapon.Geirusukeguru:
                        if (allyUnit.isWeaponSpecialRefined) {
                            if (defUnit.isPhysicalAttacker()) {
                                defUnit.battleContext.increaseCooldownCountForBoth();
                            }
                        }
                        break;
                    case Weapon.MasyumaroNoTsuePlus:
                        defUnit.defSpur += 3;
                        defUnit.resSpur += 3;
                        break;
                }
            }
        }
    }
    __applySkillEffectFromAllies(targetUnit, enemyUnit, calcPotentialDamage) {
        if (enemyUnit.canDisableEnemySpursFromAlly()) {
            return;
        }

        // 2マス以内の味方からの効果
        if (!calcPotentialDamage) {
            for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                for (let skillId of allyUnit.enumerateSkills()) {
                    switch (skillId) {
                        case Weapon.ProfessorialText:
                            if (targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)) {
                                targetUnit.battleContext.invalidatesAbsoluteFollowupAttack = true;
                                targetUnit.battleContext.invalidatesInvalidationOfFollowupAttack = true;
                            }
                            break;
                        case PassiveC.DomainOfIce:
                            targetUnit.battleContext.multDamageReductionRatioOfFirstAttack(0.3, enemyUnit);
                            break;
                        case Weapon.RenewedFang:
                            if (targetUnit.partnerHeroIndex === allyUnit.heroIndex ||
                                targetUnit.heroIndex === allyUnit.partnerHeroIndex) {
                                targetUnit.battleContext.increaseCooldownCountForBoth();
                            }
                            break;
                        case Weapon.CaduceusStaff:
                            targetUnit.battleContext.multDamageReductionRatio(0.3, enemyUnit);
                            break;
                        case Weapon.Flykoogeru:
                            if (targetUnit.getDefInPrecombat() > allyUnit.getDefInPrecombat()) {
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                            }
                            break;
                        case Weapon.YoukoohNoTsumekiba:
                            if (!allyUnit.hasStatusEffect(StatusEffectType.Panic)) {
                                targetUnit.atkSpur += allyUnit.atkBuff;
                                targetUnit.spdSpur += allyUnit.spdBuff;
                                targetUnit.defSpur += allyUnit.defBuff;
                                targetUnit.resSpur += allyUnit.resBuff;
                            }
                            break;
                        case Weapon.GengakkiNoYumiPlus:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                        case Weapon.GinNoGobulettoPlus:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                        case PassiveC.CloseGuard1:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 2;
                                targetUnit.resSpur += 2;
                            }
                            break;
                        case PassiveC.CloseGuard2:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 3;
                                targetUnit.resSpur += 3;
                            }
                            break;
                        case PassiveC.CloseGuard3:
                            if (enemyUnit.isMeleeWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                        case PassiveC.DistantGuard1:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 2;
                                targetUnit.resSpur += 2;
                            }
                            break;
                        case PassiveC.DistantGuard2:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 3;
                                targetUnit.resSpur += 3;
                            }
                            break;
                        case PassiveC.DistantGuard3:
                        case PassiveC.JointDistGuard:
                            if (enemyUnit.isRangedWeaponType()) {
                                targetUnit.defSpur += 4;
                                targetUnit.resSpur += 4;
                            }
                            break;
                    }
                }
            }
        }

        switch (targetUnit.passiveA) {
            case PassiveA.AsherasChosen:
                if (calcPotentialDamage || this.__isThereAllyExceptDragonAndBeastWithin1Space(targetUnit) == false) {
                    targetUnit.atkSpur += 6;
                    targetUnit.defSpur += 6;
                }
                break;
        }
    }

    __isThereAllyExceptDragonAndBeastWithin1Space(unit) {
        for (let allyUnit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            if (isWeaponTypeBreath(allyUnit.weaponType) == false
                && isWeaponTypeBeast(allyUnit.weaponType) == false) {
                return true;
            }
        }

        return false;
    }

    __setAttackCount(targetUnit, enemyUnit) {
        let atkWeaponInfo = targetUnit.weaponInfo;
        if (atkWeaponInfo != null) {
            targetUnit.battleContext.attackCount = atkWeaponInfo.attackCount;
            targetUnit.battleContext.counterattackCount = atkWeaponInfo.counterattackCount;
        }
        else {
            targetUnit.battleContext.attackCount = 0;
            targetUnit.battleContext.counterattackCount = 0;
        }

        // Triangle Attack
        if (targetUnit.hasStatusEffect(StatusEffectType.TriangleAttack)) {
            let triangleAttackerCount = 0;
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                if (unit.hasStatusEffect(StatusEffectType.TriangleAttack)) {
                    triangleAttackerCount++;
                }
            }
            if (targetUnit.battleContext.initiatesCombat && triangleAttackerCount >= 2) {
                targetUnit.battleContext.attackCount = 2;
            }
        }

        switch (targetUnit.passiveB) {
            case PassiveB.Shishirenzan:
                if (targetUnit.battleContext.initiatesCombat
                    && targetUnit.snapshot.isRestHpFull) {
                    targetUnit.battleContext.attackCount = 2;
                }
                break;
        }

        switch (targetUnit.weapon) {
            case Weapon.FalcionEchoes:
                if (targetUnit.battleContext.initiatesCombat && targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.snapshot.restHpPercentage == 100) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                }
                break;
            case Weapon.WhitedownSpear:
                if (targetUnit.battleContext.initiatesCombat
                    && this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                        x.moveType == MoveType.Flying) >= 2
                ) {
                    targetUnit.battleContext.attackCount = 2;
                }
                break;
            case Weapon.ShirokiNoTyokusou:
            case Weapon.ShirokiNoTyouken:
            case Weapon.ShirokiNoTansou:
                if (targetUnit.isWeaponSpecialRefined) {
                    if (targetUnit.battleContext.initiatesCombat
                        && this.__countAlliesWithinSpecifiedSpaces(targetUnit, 2, x =>
                            x.moveType == MoveType.Flying) >= 2
                    ) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                }
                break;
            case Weapon.KurohyoNoYari:
            case Weapon.MogyuNoKen:
                if (targetUnit.battleContext.initiatesCombat
                    && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                        x.moveType == MoveType.Cavalry
                        && (x.weaponType == WeaponType.Sword
                            || x.weaponType == WeaponType.Lance
                            || x.weaponType == WeaponType.Axe)
                    )) {
                    targetUnit.battleContext.attackCount = 2;
                }
                break;
            case Weapon.WakakiKurohyoNoKen:
            case Weapon.WakakiMogyuNoYari:
                if (targetUnit.isWeaponSpecialRefined) {
                    if (!targetUnit.battleContext.initiatesCombat
                        && this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                            x.moveType == MoveType.Cavalry
                            && (x.weaponType == WeaponType.Sword
                                || x.weaponType == WeaponType.Lance
                                || x.weaponType == WeaponType.Axe)
                        )) {
                        targetUnit.battleContext.counterattackCount = 2;
                    }
                }
                break;
            case Weapon.GullinkambiEgg:
                {
                    if (targetUnit.battleContext.initiatesCombat
                        && enemyUnit.snapshot.restHpPercentage >= 75
                        && this.battleContext.isCombatOccuredInCurrentTurn
                    ) {
                        targetUnit.battleContext.attackCount = 2;
                    }
                }
                break;
            case Weapon.RazuwarudoNoMaiken:
                {
                    let count = this.__countAlliesWithinSpecifiedSpaces(targetUnit, 3, x =>
                        x.buffTotal >= 10);
                    if (count >= 2) {
                        targetUnit.battleContext.attackCount = 2;
                        targetUnit.battleContext.counterattackCount = 2;
                    }
                }
                break;
        }
    }

    __isEnemyCountIsGreaterThanOrEqualToAllyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, x => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return enemyCount >= allyCount;
    }

    __isAllyCountIsGreaterThanEnemyCount(skillUnit, battleTargetUnit, calcPotentialDamage) {
        if (calcPotentialDamage) {
            return true;
        }

        let allyCount = this.__countAlliesWithinSpecifiedSpaces(skillUnit, 2, x => true);
        let enemyCount = this.__countEnemiesWithinSpecifiedSpaces(skillUnit, 2, x => x != battleTargetUnit);
        return allyCount > enemyCount;
    }

    __countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator) {
        return this._unitManager.countEnemiesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __setWrathfulStaff(atkUnit, defUnit) {
        if (defUnit.canInvalidateWrathfulStaff()) {
            return;
        }

        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;

        // 神罰の杖
        if ((atkWeaponInfo != null && atkWeaponInfo.wrathfulStaff)
            || (passiveBInfo != null && passiveBInfo.wrathfulStaff)
            || (atkUnit.weaponRefinement == WeaponRefinementType.WrathfulStaff)
        ) {
            atkUnit.battleContext.wrathfulStaff = true;
        }
    }

    __setEffectiveAttackEnabledIfPossible(atkUnit, defUnit) {
        if (atkUnit.weaponInfo == null) {
            return;
        }

        atkUnit.battleContext.isEffectiveToOpponent = false;
        for (let effective of atkUnit.weaponInfo.effectives) {
            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, effective)) {
                atkUnit.battleContext.isEffectiveToOpponent = true;
                return;
            }
        }
        if (atkUnit.hasStatusEffect(StatusEffectType.EffectiveAgainstDragons)) {
            if (DamageCalculationUtility.isEffectiveAttackEnabled(defUnit, EffectiveType.Dragon)) {
                atkUnit.battleContext.isEffectiveToOpponent = true;
                return;
            }
        }
    }

    __applySpurForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.SunflowerBowPlus:
                case Weapon.VictorfishPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);

                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.DivineSeaSpear:
                    if (targetUnit.battleContext.initiatesCombat || enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.atkSpur += enemyUnit.getAtkBuffInCombat(targetUnit);
                        targetUnit.spdSpur += enemyUnit.getSpdBuffInCombat(targetUnit);
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);

                        enemyUnit.atkSpur -= enemyUnit.getAtkBuffInCombat(targetUnit);
                        enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.PeachyParfaitPlus:
                    if (enemyUnit.snapshot.restHpPercentage >= 75) {
                        targetUnit.resSpur += enemyUnit.getResBuffInCombat(targetUnit);

                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.Hrimfaxi:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.addAllSpur(5);
                        DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
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
                            targetUnit.battleContext.healedHpByAttack = value;
                        }
                    }
                    break;
                case Weapon.OrdersSentence:
                    if (targetUnit.snapshot.restHpPercentage >= 25
                        || targetUnit.hasPositiveStatusEffect(enemyUnit)
                    ) {
                        targetUnit.addAllSpur(5);

                        let maxBuff = 0;
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
                            maxBuff = Math.max(unit.buffTotal, maxBuff);
                        }

                        targetUnit.atkSpur += maxBuff;
                    }
                    break;
                case PassiveA.AtkSpdIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.atkSpur += value; unit.spdSpur += value;
                        });
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
                case PassiveA.DefResIdeal4:
                    DamageCalculatorWrapper.__applyIdealEffect(targetUnit, enemyUnit,
                        (unit, value) => {
                            unit.defSpur += value; unit.resSpur += value;
                        });
                    break;
                case Weapon.Skinfaxi:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applySpdUnity();
                        targetUnit.applyDefUnity();
                        targetUnit.applyResUnity();
                    }
                    break;
                case Weapon.SparkingTome:
                    if (enemyUnit.snapshot.restHpPercentage >= 50) {
                        enemyUnit.resSpur -= 6;
                        enemyUnit.spdSpur -= 6;

                        let spdBuff = enemyUnit.getSpdBuffInCombat(targetUnit);
                        if (spdBuff > 0) {
                            enemyUnit.spdSpur -= spdBuff * 2;
                        }
                        let resBuff = enemyUnit.getResBuffInCombat(targetUnit);
                        if (resBuff > 0) {
                            enemyUnit.resSpur -= resBuff * 2;
                        }
                    }
                    break;
                case PassiveB.BindingNecklace:
                    if (this.__isSolo(targetUnit) || calcPotentialDamage) {
                        targetUnit.addAllSpur(2);
                        enemyUnit.addAllSpur(-2);

                        targetUnit.atkSpur += enemyUnit.getAtkBuffInCombat(targetUnit);
                        targetUnit.spdSpur += enemyUnit.getSpdBuffInCombat(targetUnit);
                        targetUnit.defSpur += enemyUnit.getDefBuffInCombat(targetUnit);
                        targetUnit.resSpur += enemyUnit.getResBuffInCombat(targetUnit);

                        enemyUnit.atkSpur -= enemyUnit.getAtkBuffInCombat(targetUnit);
                        enemyUnit.spdSpur -= enemyUnit.getSpdBuffInCombat(targetUnit);
                        enemyUnit.defSpur -= enemyUnit.getDefBuffInCombat(targetUnit);
                        enemyUnit.resSpur -= enemyUnit.getResBuffInCombat(targetUnit);
                    }
                    break;
                case Weapon.FrostfireBreath:
                    if (targetUnit.hasPositiveStatusEffect(enemyUnit)) {
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        targetUnit.atkSpur += Math.floor((
                            targetUnit.getDefBuffInCombat(enemyUnit) +
                            targetUnit.getResBuffInCombat(enemyUnit)
                        ) * 1.5);
                    }
                    break;
                case PassiveA.AtkSpdUnity:
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applySpdUnity();
                    }
                    break;
                case PassiveA.AtkDefUnity:
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyDefUnity();
                    }
                    break;
                case PassiveA.AtkResUnity:
                    if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)) {
                        targetUnit.applyAtkUnity();
                        targetUnit.applyResUnity();
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
                            if (enemyUnit.snapshot.restHpPercentage >= 75) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                targetUnit.battleContext.increaseCooldownCountForAttack = true;
                            }
                        }
                    }
                    break;
                case Weapon.BouryakuNoSenkyu:
                    if (targetUnit.buffTotal + enemyUnit.debuffTotal >= 10) {
                        enemyUnit.addAllSpur(-5);
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
                case Weapon.AxeOfDespair:
                case Weapon.TomeOfDespair:
                    if (targetUnit.snapshot.restHpPercentage >= 25) {
                        let buff = targetUnit.getBuffTotalInCombat(enemyUnit);
                        let debuffTotal = targetUnit.debuffTotal;
                        let buffDebuffTotal = buff - debuffTotal;
                        if (buffDebuffTotal >= 5) {
                            --enemyUnit.battleContext.followupAttackPriorityDecrement;

                            if (buffDebuffTotal >= 10) {
                                ++targetUnit.battleContext.followupAttackPriorityIncrement;

                                if (buffDebuffTotal >= 15) {
                                    targetUnit.battleContext.reducesCooldownCount = true;
                                }
                            }
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
                case Weapon.TwinStarAxe:
                    {
                        let buff = Math.trunc(targetUnit.getBuffTotalInCombat(enemyUnit) / 2);
                        if (buff > 0) {
                            targetUnit.atkSpur += buff;
                        }
                    }
                    break;
                case Weapon.AkatsukiNoHikari:
                    if (enemyUnit.atkDebuffTotal < 0) { targetUnit.atkSpur += -enemyUnit.atkDebuffTotal; }
                    if (enemyUnit.spdDebuffTotal < 0) { targetUnit.spdSpur += -enemyUnit.spdDebuffTotal; }
                    if (enemyUnit.defDebuffTotal < 0) { targetUnit.defSpur += -enemyUnit.defDebuffTotal; }
                    if (enemyUnit.resDebuffTotal < 0) { targetUnit.resSpur += -enemyUnit.resDebuffTotal; }
                    break;
                case Weapon.SyukuseiNoAnki:
                case Weapon.SyukuseiNoAnkiPlus:
                    {
                        let buff = enemyUnit.getBuffTotalInCombat(targetUnit);
                        if (buff > 0) {
                            targetUnit.atkSpur += buff;
                        }
                    }
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
                case Weapon.SyugosyaNoRekkyu:
                    if (targetUnit.getEvalSpdInPrecombat() > enemyUnit.getEvalSpdInPrecombat()
                        || targetUnit.getEvalSpdInCombat(enemyUnit) > enemyUnit.getEvalSpdInCombat(targetUnit)
                    ) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
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
                case Weapon.ChaosRagnell:
                    {
                        let atkAdd = Math.abs(targetUnit.atkDebuffTotal) * 2;
                        let spdAdd = Math.abs(targetUnit.spdDebuffTotal) * 2;
                        let defAdd = Math.abs(targetUnit.defDebuffTotal) * 2;
                        let resAdd = Math.abs(targetUnit.resDebuffTotal) * 2;
                        this.__writeDamageCalcDebugLog(`混沌ラグネルにより攻+${atkAdd}, 速+${spdAdd}, 守+${defAdd}, 魔+${resAdd}`);
                        targetUnit.atkSpur += atkAdd;
                        targetUnit.spdSpur += spdAdd;
                        targetUnit.defSpur += defAdd;
                        targetUnit.resSpur += resAdd;
                    }
                    break;
            }
        }
    }

    __isThereAllyIn2Spaces(targetUnit) {
        return this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
    }

    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    static __applyIdealEffect(targetUnit, enemyUnit, buffFunc) {
        if (targetUnit.snapshot.restHpPercentage == 100
            || targetUnit.hasPositiveStatusEffect(enemyUnit)
        ) {
            buffFunc(targetUnit, 7);
            if (targetUnit.snapshot.restHpPercentage == 100
                && targetUnit.hasPositiveStatusEffect(enemyUnit)
            ) {
                buffFunc(targetUnit, 2);
            }
        }
    }

    __isSolo(unit) {
        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            return false;
        }

        return true;
    }

    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }

    __applySkillEffectForUnitAfterCombatStatusFixed(targetUnit, enemyUnit, calcPotentialDamage) {
        if (targetUnit.hasStatusEffect(StatusEffectType.BonusDoubler)) {
            DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
        }

        for (let skillId of targetUnit.enumerateSkills()) {
            switch (skillId) {
                case PassiveB.BoldFighter3:
                    if (targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.Misteruthin:
                    if (!targetUnit.battleContext.initiatesCombat) {
                        targetUnit.battleContext.increaseCooldownCountForDefense = true;
                    }
                    break;
                case PassiveB.VengefulFighter3:
                    if (!targetUnit.battleContext.initiatesCombat && targetUnit.snapshot.restHpPercentage >= 50) {
                        targetUnit.battleContext.increaseCooldownCountForAttack = true;
                    }
                    break;
                case Weapon.MermaidBow:
                    if (targetUnit.snapshot.restHpPercentage >= 25 &&
                        targetUnit.battleContext.initiatesCombat) {
                        if (DamageCalculationUtility.calcAttackerTriangleAdvantage(targetUnit, enemyUnit) == TriangleAdvantage.Advantageous) {
                            if (targetUnit.getEvalSpdInCombat() >= enemyUnit.getSpdInCombat() + 1) {
                                targetUnit.battleContext.attackCount = 2;
                            }
                        }
                    }
                    break;
                case Weapon.Luin:
                    if (targetUnit.battleContext.initiatesCombat
                        || this.__isThereAllyInSpecifiedSpaces(targetUnit, 2)
                    ) {
                        targetUnit.battleContext.additionalDamage += Math.trunc(targetUnit.getEvalSpdInCombat() * 0.2);
                        targetUnit.battleContext.invalidatesCounterattack = true;
                        targetUnit.spdSpur += 6;
                    }
                    break;
                case Weapon.PlegianAxePlus:
                    if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                    break;
                case Weapon.PlegianBowPlus:
                    if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                    }
                    break;
                case Weapon.FellFlambeau:
                    if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.spdSpur -= 5;
                        enemyUnit.defSpur -= 5;
                        enemyUnit.resSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.spdSpur -= Math.abs(enemyUnit.spdDebuffTotal);
                        enemyUnit.defSpur -= Math.abs(enemyUnit.defDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case Weapon.PlegianTorchPlus:
                    if (targetUnit.battleContext.isSolo || calcPotentialDamage) {
                        enemyUnit.atkSpur -= 5;
                        enemyUnit.resSpur -= 5;
                        enemyUnit.atkSpur -= Math.abs(enemyUnit.atkDebuffTotal);
                        enemyUnit.resSpur -= Math.abs(enemyUnit.resDebuffTotal);
                    }
                    break;
                case PassiveA.Kyokazohuku3:
                case Weapon.ShinkenFalcion:
                    DamageCalculatorWrapper.__applyBonusDoubler(targetUnit, enemyUnit);
                    break;
                case Weapon.FoxkitFang:
                    if (enemyUnit.weaponType == WeaponType.Sword
                        || enemyUnit.weaponType == WeaponType.Lance
                        || enemyUnit.weaponType == WeaponType.Axe
                        || isWeaponTypeBreath(enemyUnit.weaponType)
                        || isWeaponTypeBeast(enemyUnit.weaponType)) {
                        let atkRes = targetUnit.getResInCombat(enemyUnit);
                        let defRes = enemyUnit.getResInCombat(targetUnit);
                        if (atkRes > defRes) {
                            let spurAmount = Math.floor((atkRes - defRes) * 0.5);
                            targetUnit.addAllSpur(spurAmount);
                        }
                    }
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
                case Weapon.KentoushiNoGoken:
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
            }
        }

        for (let unit of this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 2, false)) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case PassiveC.HokoNoGogeki3:
                        if (targetUnit.moveType == MoveType.Infantry) {
                            DamageCalculatorWrapper.__applyHeavyBladeSkill(targetUnit, enemyUnit);
                        }
                        break;
                    case PassiveC.HokoNoJugeki3:
                        if (targetUnit.moveType == MoveType.Infantry) {
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
                        if (targetUnit.moveType == MoveType.Infantry
                            && targetUnit.isPhysicalAttacker()
                        ) {
                            targetUnit.defSpur += 2;
                            targetUnit.resSpur += 2;
                            targetUnit.battleContext.increaseCooldownCountForBoth();
                        }
                        break;
                    case PassiveC.HokoNoMajin3:
                        if (!calcPotentialDamage) {
                            if (targetUnit.moveType == MoveType.Infantry
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
                        let count = this.__countUnit(targetUnit.groupId, x => x.hpPercentage >= 90);
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
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)) {
                    atkUnit.battleContext.additionalDamage += Math.trunc(atkUnit.getEvalAtkInCombat() * 0.15);
                }
                break;
            case Weapon.RoseQuartsBow:
                if (atkUnit.battleContext.initiatesCombat || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)) {
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
                    || this.__isThereAllyInSpecifiedSpaces(atkUnit, 2)
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
        let followupAttackPriority = this.getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage);
        if (!defUnit.battleContext.invalidatesAbsoluteFollowupAttack) {
            for (let skillId of atkUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.DarkSpikesT:
                        if (atkUnit.snapshot.restHpPercentage <= 99) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.WhitedownSpear:
                        if (this.__countUnit(atkUnit.groupId, x => x.isOnMap && x.moveType == MoveType.Flying) >= 3) {
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
                        if (this.isOddTurn) {
                            ++followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
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
        let followupAttackPriority = this.getFollowupAttackPriorityForBoth(defUnit, atkUnit, calcPotentialDamage);
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
                        if (this.isOddTurn) {
                            --followupAttackPriority;
                        }
                        break;
                    case PassiveB.EvenFollowUp3:
                        if (this.isEvenTurn) {
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
                        && this.__isTherePartnerInSpace2(atkUnit)
                    ) {
                        return true;
                    }
                }
                break;
            case Weapon.EishinNoAnki:
                if (this.__isTherePartnerInSpace2(atkUnit)) {
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

    getFollowupAttackPriorityForBoth(atkUnit, defUnit, calcPotentialDamage) {
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
                        if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1)) {
                            ++followupAttackPriority;
                        }
                        break;
                    case Weapon.SkyPirateClaw:
                        if (calcPotentialDamage || !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1)) {
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
                                && !this.__isThereAllyInSpecifiedSpaces(atkUnit, 1))
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
                        if (this.__isEnemyCountIsGreaterThanOrEqualToAllyCount(atkUnit, defUnit, calcPotentialDamage)) {
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
                        if (calcPotentialDamage || this.__isThereAllyInSpecifiedSpaces(atkUnit, 3)) {
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
                        if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)
                            || defUnit.isBuffed
                        ) {
                            --followupAttackPriority;
                        }
                        break;
                    case Weapon.TenraiArumazu:
                        if (this.__isAllyCountIsGreaterThanEnemyCount(defUnit, atkUnit, calcPotentialDamage)) {
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
                        if (this.__isThereAllyInSpecifiedSpaces(defUnit, 2)) {
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
                        if (!this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)
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
                case Weapon.WhirlingGrace:
                    if (atkUnit.snapshot.restHpPercentage >= 25) {
                        if (atkUnit.getEvalSpdInCombat() >= defUnit.getSpdInCombat() + 1) {
                            defUnit.battleContext.reducesCooldownCount = false;
                        }
                    }
                    break;
                case PassiveB.SolarBrace2:
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
                if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 1)) {
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

    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return this._unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }

    enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit) {
        return this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
    }

    enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit) {
        return this._unitManager.enumerateUnitsInDifferentGroupOnMap(unit, withTargetUnit);
    }

    __isNextToOtherUnits(unit) {
        for (let otherUnit of this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (!unit.isNextTo(otherUnit)) { continue; }
            return true;
        }
        return false;
    }

    __countUnit(groupId, predicateFunc) {
        return this._unitManager.countUnitInSpecifiedGroupOnMap(groupId, predicateFunc);
    }

    __countAlliesActionDone(targetUnit) {
        return this._unitManager.countUnitInSpecifiedGroupOnMap(targetUnit.groupId, x => x.isActionDone);
    }

    __countEnemiesActionDone(targetUnit) {
        return this._unitManager.countUnitInSpecifiedGroupOnMap(targetUnit.getEnemyGroupId(), x => x.isActionDone);
    }

    __isThereAnyAllyUnit(unit, conditionFunc) {
        return this._unitManager.isThereAnyUnitInTheSameGroupOnMap(unit, conditionFunc);
    }

    __isNear(unitA, unitB, nearRange) {
        return unitA.isWithinSpecifiedDistanceFrom(unitB, nearRange);
    }

    __isInCloss(unitA, unitB) {
        return unitB.isInClossOf(unitA);
    }

    // 自身を中心とした縦〇列と横〇列
    __isInClossWithOffset(unitA, unitB, offset) {
        return unitB.isInClossWithOffset(unitA, offset);
    }

    __isTherePartnerInSpace3(unit) {
        return this.__isThereAnyAllyUnit(unit,
            x => unit.calculateDistanceToUnit(x) <= 3
                && unit.partnerHeroIndex == x.heroIndex);
    }

    __addSpurInRange3(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of allyUnit.enumerateSkills()) {
            if (!calcPotentialDamage) {
                switch (skillId) {
                    case Weapon.GaeBolg:
                        if (allyUnit.isWeaponRefined) {
                            if (allyUnit.isWeaponSpecialRefined) {
                                if (targetUnit.weaponType === WeaponType.Sword ||
                                    targetUnit.weaponType === WeaponType.Lance ||
                                    targetUnit.weaponType === WeaponType.Axe ||
                                    targetUnit.moveType === MoveType.Cavalry
                                ) {
                                    targetUnit.atkSpur += 5;
                                    targetUnit.defSpur += 5;
                                }
                            }
                        }
                        break;
                }
            }
        }
    }

    __addSpurInRange2(targetUnit, allyUnit, calcPotentialDamage) {
        for (let skillId of allyUnit.enumerateSkills()) {
            if (!calcPotentialDamage) {
                switch (skillId) {
                    case PassiveC.DomainOfIce:
                        targetUnit.spdSpur += 4;
                        targetUnit.resSpur += 4;
                        break;
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
                    case Weapon.TannenbatonPlus:
                        targetUnit.defSpur += 2;
                        targetUnit.resSpur += 2;
                        targetUnit.battleContext.reducesCooldownCount = true;
                        break;
                    case Weapon.SpearOfAssal:
                        targetUnit.atkSpur += 4;
                        targetUnit.spdSpur += 4;
                        break;
                    case Weapon.DanielMadeBow:
                        targetUnit.atkSpur += 5;
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
                            if (targetUnit.moveType == MoveType.Flying || targetUnit.moveType == MoveType.Cavalry) {
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
                        targetUnit.atkSpur += 3;
                        targetUnit.defSpur += 3;
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
                            if (targetUnit.partnerHeroIndex == allyUnit.heroIndex) {
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
                        if (targetUnit.moveType == MoveType.Armor) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadArmor:
                        if (targetUnit.moveType == MoveType.Armor) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case PassiveC.WardFliers:
                        if (targetUnit.moveType == MoveType.Flying) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadFliers:
                        if (targetUnit.moveType == MoveType.Flying) {
                            targetUnit.atkSpur += 4;
                            targetUnit.spdSpur += 4;
                        }
                        break;
                    case PassiveC.WardCavalry:
                        if (targetUnit.moveType == MoveType.Cavalry) {
                            targetUnit.defSpur += 4;
                            targetUnit.resSpur += 4;
                        }
                        break;
                    case PassiveC.GoadCavalry:
                        if (targetUnit.moveType == MoveType.Cavalry) {
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
                    default:
                        break;
                }
            }
        }
    }

    __addSpurInRange1(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
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
        }
    }

    __addSelfSpurInRange1(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
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
        }
    }
    __addSelfSpurInRange2(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
                default:
                    break;
            }
        }
    }

    __addSelfSpurIfAllyAvailableInRange2(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
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
                case Weapon.SpearOfAssal:
                    targetUnit.atkSpur += 4;
                    targetUnit.spdSpur += 4;
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
                case Weapon.ChichiNoSenjutsusyo:
                    targetUnit.atkSpur += 3;
                    targetUnit.spdSpur += 3;
                    break;
                case Weapon.JunaruSenekoNoTsumekiba:
                    targetUnit.atkSpur += 3;
                    targetUnit.defSpur += 3;
                    break;
                case Weapon.VezuruNoYoran:
                    targetUnit.atkSpur += 5;
                    targetUnit.spdSpur += 5;
                    targetUnit.defSpur += 5;
                    targetUnit.resSpur += 5;
                    break;
                case Weapon.OgonNoFolkPlus:
                case Weapon.NinjinhuNoSosyokuPlus:
                    targetUnit.atkSpur += 5;
                    targetUnit.defSpur += 5;
                    break;
            }
        }
    }

    __addSelfSpurIfAllyAvailableInRange1(targetUnit, skillId, calcPotentialDamage) {
        if (!calcPotentialDamage) {
            switch (skillId) {
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
                case Weapon.Thirufingu:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.atkSpur += 5;
                        targetUnit.defSpur += 5;
                    }
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
                case Weapon.Fensariru:
                    if (targetUnit.isWeaponSpecialRefined) {
                        targetUnit.spdSpur += 5;
                        targetUnit.defSpur += 5;
                    }
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
                default:
                    break;
            }
        }
    }

    __countBreakableDefenseStructuresWithoutEnergyOnMap() {
        return this.map.countObjs(st => st instanceof DefenceStructureBase && !(st instanceof Ornament) && st.isBreakable && !st.isRequired);
    }

    __countDefenceStructuresOnMap() {
        return this.__countBreakableDefenseStructuresWithoutEnergyOnMap() + 1;
    }

    __calcKojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count <= 2) {
            return 10;
        }
        else if (count == 3) {
            return 7;
        }
        else if (count == 4) {
            return 4;
        }
        else {
            return 1;
        }
    }

    __calcBojosenSpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count >= 5) {
            return 10;
        }
        else if (count == 4) {
            return 7;
        }
        else if (count == 3) {
            return 4;
        }
        else {
            return 1;
        }
    }

    __calcBojosen4SpurAmount() {
        let count = this.__countDefenceStructuresOnMap();
        if (count >= 5) {
            return 11;
        } else if (count === 4) {
            return 7;
        } else {
            return 3;
        }
    }
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
    }

    updateUnitSpur(targetUnit, calcPotentialDamage = false, ignoresSkillEffectFromAllies = false) {
        this.__updateUnitSpur(targetUnit, calcPotentialDamage, ignoresSkillEffectFromAllies);
    }

    __updateUnitSpur(targetUnit, calcPotentialDamage = false, ignoresSkillEffectFromAllies = false) {
        targetUnit.resetSpurs();

        if (!calcPotentialDamage) {
            if (!ignoresSkillEffectFromAllies) {
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
                    // 距離に関係ないもの
                    {
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case PassiveC.WingsOfLight:
                                    if (targetUnit.isMythicHero
                                        && g_appData.currentTurn <= 5
                                        && this.__countUnit(targetUnit.groupId, x => x.isOnMap && x.isMythicHero) <= 3
                                    ) {
                                        targetUnit.addAllSpur(2 + g_appData.currentTurn);
                                    }
                                    break;
                            }
                        }
                    }

                    if (Math.abs(unit.posX - targetUnit.posX) <= 1 && Math.abs(unit.posY - targetUnit.posY) <= 2) {
                        // 5×3マス以内にいる場合
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case Weapon.FlowerOfPlenty:
                                    targetUnit.atkSpur += 3;
                                    targetUnit.resSpur += 3;
                                    break;
                            }
                        }
                    }

                    if (Math.abs(unit.posX - targetUnit.posX) <= 3 && Math.abs(unit.posY - targetUnit.posY) <= 3) {
                        // 7×7マス以内にいる場合
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case Weapon.DaichiBoshiNoBreath:
                                    {
                                        targetUnit.addAllSpur(2);
                                    }
                                    break;
                            }
                        }
                    }

                    if (this.__isNear(unit, targetUnit, 3)) {
                        // 3マス以内で発動する戦闘中バフ
                        for (let skillId of unit.enumerateSkills()) {
                            switch (skillId) {
                                case Weapon.FirstDreamBow:
                                    targetUnit.atkSpur += 4;
                                    break;
                                case Weapon.Hlidskjalf:
                                    if (unit.isWeaponSpecialRefined) {
                                        targetUnit.atkSpur += 3;
                                        targetUnit.spdSpur += 3;
                                    }
                                    break;
                            }
                        }
                    }

                    if (this.__isNear(unit, targetUnit, 3)) {
                        // 3マス以内で発動する戦闘中バフ
                        // this.writeDebugLogLine(unit.getNameWithGroup() + "の3マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                        this.__addSpurInRange3(targetUnit, unit, calcPotentialDamage);
                    }

                    if (this.__isNear(unit, targetUnit, 2)) {
                        // 2マス以内で発動する戦闘中バフ
                        // this.writeDebugLogLine(unit.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                        this.__addSpurInRange2(targetUnit, unit, calcPotentialDamage);
                    }

                    if (this.__isNear(unit, targetUnit, 1)) {
                        // 1マス以内で発動する戦闘中バフ
                        this.__addSpurInRange1(targetUnit, unit.passiveC, calcPotentialDamage);
                        this.__addSpurInRange1(targetUnit, unit.passiveS, calcPotentialDamage);
                    }

                    if (this.__isInCloss(unit, targetUnit)) {
                        // 十字方向
                        switch (unit.weapon) {
                            case Weapon.BondOfTheAlfar:
                                targetUnit.atkSpur += 6;
                                break;
                            case Weapon.FlowerOfJoy:
                                targetUnit.atkSpur += 3;
                                targetUnit.spdSpur += 3;
                                break;
                        }
                    }

                    if (this.__isInClossWithOffset(unit, targetUnit, 1)) {
                        switch (unit.weapon) {
                            case Weapon.ChargingHorn:
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                                break;
                        }
                    }
                }
            }

            // 周囲の敵から受ける戦闘中弱化
            {
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(targetUnit)) {
                    if (this.__isInCloss(unit, targetUnit)) {
                        // 十字方向
                        switch (unit.weapon) {
                            case Weapon.FlowerOfSorrow:
                                targetUnit.defSpur -= 4;
                                targetUnit.resSpur -= 4;
                                break;
                        }
                    }
                }

                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 3)) {
                    for (let skillId of unit.enumerateSkills()) {
                        switch (skillId) {
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
                        }
                    }
                }

                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, 2)) {
                    for (let skillId of unit.enumerateSkills()) {
                        switch (skillId) {
                            case Weapon.UnboundBlade:
                            case Weapon.UnboundBladePlus:
                                if (this.__isSolo(unit)) {
                                    targetUnit.atkSpur -= 5;
                                    targetUnit.defSpur -= 5;
                                }
                                break;
                            case Weapon.DanielMadeBow:
                                targetUnit.atkSpur -= 5;
                                break;
                            case Weapon.ObsessiveCurse:
                                targetUnit.spdSpur -= 5;
                                targetUnit.resSpur -= 5;
                                break;
                            case PassiveC.AtkSpdRein3:
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
                            case Weapon.ReinBow:
                            case Weapon.ReinBowPlus:
                            case PassiveC.SpdDefRein3:
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
                            case Weapon.ExoticFruitJuice:
                                targetUnit.spdSpur -= 6;
                                targetUnit.resSpur -= 6;
                                break;
                            case Weapon.TharjasHex:
                                if (unit.isWeaponSpecialRefined) {
                                    targetUnit.atkSpur -= 4;
                                    targetUnit.spdSpur -= 4;
                                }
                                break;
                            case Weapon.GeneiLod:
                                targetUnit.atkSpur -= 6;
                                targetUnit.resSpur -= 6;
                                break;
                            case Weapon.Gurgurant:
                                targetUnit.atkSpur -= 5;
                                targetUnit.defSpur -= 5;
                                break;
                            case PassiveC.InevitableDeath:
                                targetUnit.atkSpur -= 4;
                                targetUnit.spdSpur -= 4;
                                targetUnit.defSpur -= 4;
                                targetUnit.resSpur -= 4;
                                break;
                        }
                    }
                }
            }
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
                if (targetUnit.partnerHeroIndex == unit.heroIndex) {
                    let dist = calcDistance(targetUnit.posX, targetUnit.posY, unit.posX, unit.posY);
                    if (dist < nearestDist) {
                        nearestPartner = unit;
                        nearestDist = dist;
                    }
                }
            }

            if (nearestPartner != null) {
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
                }
            }
        }

        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(targetUnit)) {
            if (this.__isNear(unit, targetUnit, 2)) {
                // 2マス以内で発動する戦闘中バフ
                // this.writeDebugLogLine(unit.getNameWithGroup() + "の2マス以内で発動する戦闘中バフを" + targetUnit.getNameWithGroup() + "に適用");
                this.__addSelfSpurInRange2(targetUnit, targetUnit.passiveA, calcPotentialDamage);
                this.__addSelfSpurInRange2(targetUnit, targetUnit.weapon, calcPotentialDamage);
                isAllyAvailableRange2 = true;
            }

            if (this.__isNear(unit, targetUnit, 1)) {
                // 1マス以内で発動する戦闘中バフ
                this.__addSelfSpurInRange1(targetUnit, targetUnit.weapon, calcPotentialDamage);
                isAllyAvailableRange1 = true;
            }
        }

        if (isAllyAvailableRange1) {
            for (let skillId of targetUnit.enumerateSkills()) {
                this.__addSelfSpurIfAllyAvailableInRange1(targetUnit, skillId, calcPotentialDamage);
            }
        }
        if (isAllyAvailableRange2) {
            for (let skillId of targetUnit.enumerateSkills()) {
                this.__addSelfSpurIfAllyAvailableInRange2(targetUnit, skillId, calcPotentialDamage);
            }
        }

        // 孤軍
        if (this.__isSolo(targetUnit) || calcPotentialDamage) {
            for (let skillId of targetUnit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.TallHammer:
                        if (targetUnit.isWeaponRefined) {
                            targetUnit.spdSpur += 6;
                        }
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                    case Weapon.SurvivalistBow:
                        targetUnit.atkSpur += 6;
                        targetUnit.spdSpur += 6;
                        break;
                    case Weapon.DoubleBow:
                        targetUnit.addAllSpur(5);
                        break;
                    case Weapon.GousouJikumunto:
                    case Weapon.KokkiNoKosou:
                    case Weapon.MaritaNoKen:
                        targetUnit.addAllSpur(4);
                        break;
                    case Weapon.ShirejiaNoKaze:
                    case Weapon.BrazenCatFang:
                    case Weapon.VengefulLance:
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
                    case Weapon.KurokiChiNoTaiken:
                        if (targetUnit.isWeaponSpecialRefined) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                }
            }
        }

        // その他
        for (let skillId of targetUnit.enumerateSkills()) {
            // 潜在ダメージ計算に加味される効果
            switch (skillId) {
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
            }

            // 潜在ダメージ計算で無視される効果
            if (!calcPotentialDamage) {
                switch (skillId) {
                    case Weapon.AstralBreath:
                        if (this.__isTherePartnerInSpace3(targetUnit)) {
                            targetUnit.addAllSpur(5);
                        }
                        break;
                    case Weapon.Rigarublade:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => isWeaponTypeTome(x.weaponType) && x.moveType == MoveType.Infantry)
                            ) {
                                targetUnit.addAllSpur(3);
                            }
                        }
                        break;
                    case Weapon.Vidofuniru:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType == MoveType.Armor || x.moveType == MoveType.Infantry)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.spdSpur += 5;
                            }
                        }
                        break;
                    case Weapon.HinokaNoKounagitou:
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                            x => x.moveType == MoveType.Flying || x.moveType == MoveType.Infantry)
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                    case Weapon.KamiraNoEnfu:
                        if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                            x => x.moveType == MoveType.Flying || x.moveType == MoveType.Cavalry)
                        ) {
                            targetUnit.atkSpur += 5;
                            targetUnit.spdSpur += 5;
                        }
                        break;
                    case Weapon.Simuberin:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.moveType == MoveType.Flying)
                            ) {
                                targetUnit.atkSpur += 5;
                                targetUnit.resSpur += 5;
                            }
                        }
                        break;
                    case Weapon.Ora:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2,
                                x => x.weaponType == WeaponType.Staff || isWeaponTypeTome(x.weaponType))
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
                                x.weaponType == WeaponType.Staff || isWeaponTypeTome(x.weaponType))
                            ) {
                                targetUnit.atkSpur += 4;
                                targetUnit.spdSpur += 4;
                            }
                        }
                        break;
                    case Weapon.KentoushiNoGoken:
                        if (targetUnit.isWeaponSpecialRefined) {
                            if (this.__isThereAllyInSpecifiedSpaces(targetUnit, 2, x =>
                                x.moveType == MoveType.Infantry || x.moveType == MoveType.Flying)
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
                                if (unit.moveType == MoveType.Infantry
                                    || unit.moveType == MoveType.Cavalry) {
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
                                if (unit.moveType == MoveType.Infantry
                                    || unit.moveType == MoveType.Cavalry) {
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
                        this.__applyFormSkill(targetUnit,
                            (unit, amount) => {
                                unit.atkSpur += amount;
                                unit.spdSpur += amount;
                            });
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

    __isTherePartnerInSpace2(unit) {
        return this.__isThereAnyAllyUnit(unit,
            x => unit.calculateDistanceToUnit(x) <= 2
                && unit.partnerHeroIndex == x.heroIndex);
    }

    __isThereAnyPartnerPairsIn3Spaces(targetUnit) {
        let units = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, 3));
        let partners = units.map(u => u.partnerHeroIndex);
        return units.some(u => partners.includes(u.heroIndex));
    }

    /// 実装の移植を楽にするために暫定的に用意
    __writeDamageCalcDebugLog(message) {
        this.writeDebugLog(message);
    }
}
