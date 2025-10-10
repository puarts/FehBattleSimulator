
class BeginningOfTurnSkillHandler {
    /**
     * @param  {UnitManager} unitManager
     * @param  {BattleMap} map
     * @param  {GlobalBattleContext} globalBattleContext
     * @param  {LoggerBase} logger
     * @param  {Function} moveStructureToTrashBox
     */
    constructor(unitManager, map, globalBattleContext, logger, moveStructureToTrashBox) {
        /** @type {UnitManager} */
        this._unitManager = unitManager;
        /** @type {BattleMap} */
        this.map = map;
        /** @type {GlobalBattleContext} */
        this.globalBattleContext = globalBattleContext;
        /** @type {LoggerBase} */
        this._logger = logger;
        /** @type {Function} */
        this.moveStructureToTrashBox = moveStructureToTrashBox;
    }
    get isOddTurn() {
        return this.globalBattleContext.isOddTurn;
    }
    get isEvenTurn() {
        return this.globalBattleContext.isEvenTurn;
    }
    get isFirstTurn() {
        return this.globalBattleContext.isFirstTurn;
    }
    /** @type {UnitManager} */
    get unitManager() {
        return this._unitManager;
    }

    get log() {
        return this._logger.log;
    }

    writeLog(message) {
        this._logger.writeLog(message);
    }

    writeDebugLog(message) {
        this._logger.writeDebugLog(message);
    }

    clearLog() {
        this._logger.clearLog();
    }

    /**
     * 自軍ターン開始時スキル
     * @param  {Unit} unit
     */
    applySkillsForBeginningOfTurn(unit) {
        this.applyTransformSkillForBeginningOfTurn(unit);

        let env = new AtStartOfTurnEnv(this, unit);
        env.setName('ターン開始時').setLogLevel(getSkillLogLevel());
        AT_START_OF_TURN_HOOKS.evaluateWithUnit(unit, env);
        for (let skillId of unit.enumerateSkills()) {
            this.applySkillForBeginningOfTurn(skillId, unit);
        }
    }

    /**
     * 敵軍ターン開始時スキル
     * @param  {Unit} unit
     */
    applyEnemySkillsForBeginningOfTurn(unit) {
        this.applyEnemyTransformSkillForBeginningOfTurn(unit);

        let env = new AtStartOfTurnEnv(this, unit);
        env.setName('敵軍ターン開始時').setLogLevel(getSkillLogLevel());
        AT_START_OF_ENEMY_PHASE_HOOKS.evaluateWithUnit(unit, env);

        for (let skillId of unit.enumerateSkills()) {
            this.applyEnemySkillForBeginningOfTurn(skillId, unit);
        }
    }

    /**
     * 自軍のターン開始時スキル発動後のスキル
     * @param  {Unit} unit
     */
    applySkillsAfterSkillsForBeginningOfTurn(unit) {
        if (unit.hasStatusEffect(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately)) {
            this.writeDebugLog(`${unit.nameWithGroup}はステータス${getStatusEffectName(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately)}により行動終了`);
            unit.endActionByStatusEffect();
        }
        let env = new AtStartOfTurnEnv(this, unit);
        env.setName('自軍のターン開始時スキル発動後').setLogLevel(getSkillLogLevel());
        AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_PLAYER_PHASE_HOOKS.evaluateWithUnit(unit, env);
        for (let skillId of unit.enumerateSkills()) {
            this.applySkillAfterSkillsForBeginningOfTurn(skillId, unit);
        }
    }

    /**
     * 敵軍のターン開始時スキル発動後のスキル
     * @param  {Unit} unit
     */
    applySkillsAfterEnemySkillsForBeginningOfTurn(unit) {
        let env = new AtStartOfTurnEnv(this, unit);
        env.setName('敵軍のターン開始時スキル発動後').setLogLevel(getSkillLogLevel());
        AFTER_START_OF_TURN_EFFECTS_TRIGGER_ON_ENEMY_PHASE_HOOKS.evaluateWithUnit(unit, env);
        for (let skillId of unit.enumerateSkills()) {
            this.applySkillAfterEnemySkillsForBeginningOfTurn(skillId, unit);
        }
    }

    /**
     * @param  {Unit} unit
     */
    applyHpSkillsForBeginningOfTurn(unit) {
        for (let skillId of unit.enumerateSkills()) {
            this.applyHpSkillForBeginningOfTurn(skillId, unit);
        }
    }

    applyReservedStateForAllUnitsOnMap(isBeginningOfTurn = true, applyDivineVein = true) {
        for (let unit of this._unitManager.enumerateAllUnitsOnMap()) {
            if (unit.isDead) {
                continue;
            }
            unit.applyReservedState(isBeginningOfTurn);
        }
        if (applyDivineVein) {
            this.map.applyReservedDivineVein();
        }
    }

    /**
     * @param  {Boolean} leavesOneHp
     */
    applyReservedHpForAllUnitsOnMap(leavesOneHp) {
        for (let unit of this._unitManager.enumerateAllUnitsOnMap()) {
            if (unit.isDead) {
                continue;
            }
            let [hp, damage, heal , reducedHeal] = unit.applyReservedHp(leavesOneHp);
            this.writeDebugLog(`予約された回復、ダメージを反映 [ユニット, hp, damage, heal, reducedHeal] : ${unit.nameWithGroup}, ${hp}, ${damage}, ${heal}, ${reducedHeal}`);
        }
    }

    /**
     * ターン開始時の化身処理を行う
     * @param skillOwner
     */
    applyTransformSkillForBeginningOfTurn(skillOwner) {
        // TODO: 化身を予約制にする
        if (isWeaponTypeBeast(skillOwner.weaponType) && skillOwner.hasWeapon) {
            let env = new AtStartOfTurnEnv(this, skillOwner);
            env.setName('化身スキル').setLogLevel(getSkillLogLevel());
            let canTransform = CAN_TRANSFORM_AT_START_OF_TURN_HOOKS.evaluateSomeWithUnit(skillOwner, env);
            for (let skillId of skillOwner.enumerateSkills()) {
                let func = getSkillFunc(skillId, hasTransformSkillsFuncMap);
                canTransform |= func?.call(this) ?? false;
                switch (skillId) {
                    case PassiveB.BeastAgility3:
                    case PassiveB.BeastNTrace3:
                    case PassiveB.BeastFollowUp3:
                    case PassiveB.BeastSense4:
                    case PassiveB.BindingNecklacePlus:
                        canTransform = true;
                        break;
                }
                if (canTransform) {
                    break;
                }
            }
            if (!this.__isNextToOtherUnitsExceptDragonAndBeast(skillOwner) || canTransform) {
                skillOwner.isTransformed = true;
                if (skillOwner.moveType === MoveType.Flying &&
                    isWeaponTypeBeast(skillOwner.weaponType) &&
                    !skillOwner.hasStatusEffect(StatusEffectType.FalseStart)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
            } else {
                skillOwner.isTransformed = false;
            }
        }
        // 闇ムワリムの特殊化身処理
        switch (skillOwner.weapon) {
            case Weapon.WildTigerFang: {
                let currentTurn = this.globalBattleContext.currentTurn;
                skillOwner.isTransformed = currentTurn === 2 || currentTurn >= 4;
                break;
            }
        }
    }

    /**
     * 敵ターン開始時の化身処理を行う
     * @param skillOwner
     */
    applyEnemyTransformSkillForBeginningOfTurn(skillOwner) {
        if (isWeaponTypeBeast(skillOwner.weaponType) && skillOwner.hasWeapon) {
            let env = new AtStartOfTurnEnv(this, skillOwner);
            env.setName('敵化身スキル').setLogLevel(getSkillLogLevel());
            if (CAN_TRANSFORM_AT_START_OF_ENEMY_TURN_HOOKS.evaluateSomeWithUnit(skillOwner, env)) {
                this.applyTransformSkillForBeginningOfTurn(skillOwner);
            }
        }
    }

    /**
     * @param  {Number} skillId
     * @param  {Unit} skillOwner
     */
    applySkillForBeginningOfTurn(skillId, skillOwner) {
        // ターン開始スキル不可である場合は処理を終える
        if (skillOwner.hasStatusEffect(StatusEffectType.FalseStart)) return;

        getSkillFunc(skillId, applySkillForBeginningOfTurnFuncMap)?.call(this, skillOwner);
        switch (skillId) {
            case Weapon.PaydayPouch: {
                let count = this.__countAlliesWithinSpecifiedSpaces(skillOwner, 2);
                if (count >= 1) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                }
                if (count >= 2) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Hexblade);
                }
            }
                break;
            case Weapon.PumpkinStemPlus:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToApplyBuffs(6, 0, 0, 6);
                    }
                }
                break;
            case Weapon.InspiritedSpear: {
                let found = false;
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (skillOwner.isInCrossWithOffset(unit, 1)) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToApplyBuffs(0, 6, 6, 0);
                    }
                }
            }
                break;
            case PassiveC.HeartOfCrimea: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    found = true;
                    unit.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                }
                if (found) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                }
            }
                break;
            case Weapon.HeiredGungnir:
                if (skillOwner.battleContext.restHpPercentage >= 25) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        if (unit === skillOwner || unit.moveType === MoveType.Flying) {
                            unit.reserveToApplyBuffs(6, 0, 6, 0);
                            unit.reserveToAddStatusEffect(StatusEffectType.Charge);
                        }
                    }
                }
                break;
            case Weapon.HeiredForseti:
                if (skillOwner.battleContext.restHpPercentage >= 25) {
                    skillOwner.reserveToApplyBuffs(6, 6, 0, 0);
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveB.TwinSkyWing: {
                let partner = null;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                    if (unit.isPartner(skillOwner)) {
                        // 2人以上いた場合は効果を発揮しない
                        if (partner !== null) {
                            partner = null;
                            break;
                        }
                        partner = unit;
                    }
                }
                if (partner !== null) {
                    partner.reserveToAddStatusEffect(StatusEffectType.Pathfinder);
                }
            }
                break;
            case Weapon.WindTribeClubPlus:
            case Weapon.WhitewindBowPlus:
            case Weapon.PlayfulPinwheel:
                if (skillOwner.battleContext.restHpPercentage >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
                break;
            case PassiveC.TipTheScales: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    found = true;
                    unit.reserveToAddStatusEffect(StatusEffectType.RallySpectrum);
                }
                if (found) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.RallySpectrum);
                }
            }
                break;
            case Weapon.VezuruNoYoran:
                if (skillOwner.isWeaponSpecialRefined) {
                    for (let enemy of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 5)) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemy, 2, true)) {
                            unit.reserveToApplyDebuffs(0, 0, -6, -6);
                            unit.reserveToAddStatusEffect(StatusEffectType.Exposure);
                        }
                    }
                }
                break;
            case Weapon.ShirejiaNoKaze:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (skillOwner.battleContext.restHpPercentage >= 25) {
                        skillOwner.applyBuffs(6, 6, 0, 0);
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.Desperation);
                    }
                }
                break;
            case Special.SupremeAstra:
                if (skillOwner.isSpecialCountMax) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case Special.ChivalricAura:
                if (skillOwner.isSpecialCountMax) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveA.Mastermind:
                skillOwner.reserveTakeDamage(1);
                break;
            case Weapon.BakedTreats:
                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 5)) {
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        ally.reserveToApplyDebuffs(0, 0, -6, -6);
                        ally.reserveToAddStatusEffect(StatusEffectType.Sabotage);
                    }
                }
                break;
            case PassiveC.DreamDeliverer:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.battleContext.neutralizesAnyPenaltyWhileBeginningOfTurn = true;
                        unit.applyBuffs(0, 0, 6, 6);
                        unit.reserveToAddStatusEffect(StatusEffectType.ResonantShield);
                    }
                }
                break;
            case Weapon.PackleaderTome:
                if (skillOwner.battleContext.restHpPercentage >= 25) {
                    for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                        for (let enemy of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                            enemy.reserveToApplyDebuffs(0, -6, 0, -6);
                            enemy.reserveToAddStatusEffect(StatusEffectType.Panic);
                        }
                    }
                }
                break;
            case Weapon.TomeOfLaxuries:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
                if (skillOwner.battleContext.restHpPercentage >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                }
                break;
            case Weapon.DesertTigerAxe:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(1);
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                        if (skillOwner.hp + 1 >= unit.hp) {
                            unit.reserveToReduceSpecialCount(1);
                        }
                    }
                }
                skillOwner.applyAtkSpdBuffs(6);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.NeutralizesPenalties);
                skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                    if (skillOwner.hp + 1 >= unit.hp) {
                        unit.applyAtkSpdBuffs(6);
                        unit.reserveToAddStatusEffect(StatusEffectType.NeutralizesPenalties);
                        unit.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                    }
                }
                break;
            case Weapon.PartnershipBow:
                for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToAddStatusEffect(StatusEffectType.Panic);
                        u.reserveToAddStatusEffect(StatusEffectType.Discord);
                    }
                }
                break;
            case Weapon.SeafoamSplitter:
                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 1) <= 2) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Weapon.IlianMercLance:
                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 1) <= 2) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        if (skillOwner.partnerHeroIndex === unit.heroIndex ||
                            unit.partnerHeroIndex === skillOwner.heroIndex) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Dodge);
                            unit.reserveToAddStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                        }
                    }
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Dodge);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                }
                break;
            case Weapon.VassalSaintSteel:
                if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                    this.writeDebugLog(`${skillOwner.getNameWithGroup()}は始まりの鼓動(skillId: ${skillId})を発動`);
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveC.RallyingCry: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    found = true;
                    unit.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                    if (unit.moveType === MoveType.Flying) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Charge);
                    }
                }
                if (found) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Charge);
                }
            }
                break;
            case PassiveC.ASReinSnap:
            case PassiveC.SDReinSnap: {
                if (isRefreshSupportSkill(skillOwner.support)) {
                    break;
                }
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    if (unit.moveType === MoveType.Armor ||
                        (isMeleeWeaponType(unit.weaponType) && unit.moveType === MoveType.Infantry)) {
                        found = true;
                        unit.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                if (found) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
            }
                break;
            case Weapon.Sekuvaveku:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.globalBattleContext.currentTurn === 1) {
                        skillOwner.reserveToReduceSpecialCount(2);
                    }
                }
                break;
            case PassiveC.AlarmAtkSpd:
                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 1) <= 2) {
                    skillOwner.applyAtkSpdBuffs(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Canto1);
                }
                break;
            case PassiveC.AlarmAtkDef:
                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 1) <= 2) {
                    skillOwner.applyAtkDefBuffs(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Canto1);
                }
                break;
            case PassiveC.AlarmSpdDef:
                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 1) <= 2) {
                    skillOwner.applySpdDefBuffs(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Canto1);
                }
                break;
            case Weapon.Asclepius:
                this.__applySabotageSkill(skillOwner, unit => {
                    unit.reserveToApplyDebuffs(-6, 0, 0, -6);
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }, 1);
                break;
            case Weapon.LoneWolf:
                if (skillOwner.restHpPercentageAtBeginningOfTurn >= 25) {
                    if (skillOwner.isSpecialCountMax) {
                        skillOwner.reserveToReduceSpecialCount(2);
                    } else if (Number(skillOwner.specialCount) === Number(skillOwner.maxSpecialCount) - 1) {
                        skillOwner.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.MysticWarStaff: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    found = true;
                    unit.applyBuffs(0, 0, 6, 6);
                    unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                }
            }
                break;
            case Weapon.TotalWarTome:
                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 5)) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyAllDebuff(-5);
                        u.reserveToAddStatusEffect(StatusEffectType.Sabotage);
                        u.reserveToAddStatusEffect(StatusEffectType.Stall);
                    }
                }
                break;
            case Weapon.GustyWarBow:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 3)) {
                    if (skillOwner.isSpecialCountMax) {
                        skillOwner.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case PassiveC.FettersOfDromi:
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                break;
            case PassiveA.AtkSpdHexblade:
            case PassiveA.SpdResHexblade: {
                let pred = unit => isWeaponTypeTome(unit.weaponType);
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2, pred)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Hexblade);
                }
            }
                break;
            case Weapon.FrelianLance:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    if (unit.moveType === MoveType.Flying) {
                        unit.reserveToAddStatusEffect(StatusEffectType.ShieldFlying);
                    }
                }
                break;
            case Weapon.TenseiAngel:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__isThereAllyIn2Spaces(skillOwner)) {
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                    }
                    if (skillOwner.isSpecialCountMax) {
                        skillOwner.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.SisterlyWarAxe:
                if (this.isOddTurn) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
                break;
            case Weapon.BowOfRepose:
                if (skillOwner.restHpPercentageAtBeginningOfTurn === 100) {
                    let found = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        found = true;
                        unit.reserveTakeDamage(1);
                    }
                    if (found) {
                        skillOwner.reserveTakeDamage(1);
                    }
                }
                break;
            case Weapon.MatersTactics:
                if (skillOwner.restHpPercentageAtBeginningOfTurn >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.GrandStrategy);
                    skillOwner.reserveToApplyAllDebuff(-4);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.GrandStrategy);
                        let statuses = unit.getStatusesInPrecombat();
                        statuses[0] -= 15;
                        let uniqArray = Array.from(new Set(statuses));
                        uniqArray.sort((a, b) => b - a);
                        let highStatuses = [uniqArray[0]];
                        if (uniqArray.length >= 2) {
                            highStatuses.push(uniqArray[1]);
                        }
                        let buffs = statuses.map(s => highStatuses.includes(s) ? -6 : 0);
                        unit.reserveToApplyDebuffs(...buffs);
                    }

                    for (let enemy of this.__findNearestEnemies(skillOwner)) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemy, 3, true)) {
                            unit.reserveToApplyAllDebuff(-3);
                        }
                    }
                }
                break;
            case Weapon.CrimeanScepter: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    found = true;
                    unit.applyBuffs(6, 6, 0, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                }
                if (found) {
                    skillOwner.applyBuffs(6, 6, 0, 0);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                }
            }
                break;
            case Weapon.DuskbloomBow:
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (skillOwner.posX === unit.posX ||
                        skillOwner.posY === unit.posY) {
                        if (unit.getEvalResInPrecombat() < skillOwner.getEvalResInPrecombat()) {
                            unit.reserveToApplyDebuffs(0, 0, -7, -7);
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                }
                break;
            case PassiveB.KillingIntentPlus:
                for (let enemy of this.__findNearestEnemies(skillOwner, 5)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(enemy, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Exposure);
                    }
                }
                break;
            case Weapon.BrilliantStarlight:
                if (skillOwner.restHpPercentageAtBeginningOfTurn >= 25) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.applyBuffs(0, 0, 6, 6);
                        unit.reserveToAddStatusEffect(StatusEffectType.ReduceDamageFromAreaOfEffectSpecialsBy80Percent);
                    }
                }
                break;
            case Weapon.Liberation:
                if (skillOwner.restHpPercentageAtBeginningOfTurn >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Charge);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                        if (skillOwner.heroIndex === unit.partnerHeroIndex ||
                            unit.heroIndex === skillOwner.partnerHeroIndex) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Charge);
                        }
                    }
                }
                break;
            case Weapon.JoyousTome: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                    found = true;
                    unit.reserveHeal(7);
                }
                if (found) {
                    skillOwner.reserveHeal(7);
                }
            }
                break;
            case Weapon.BouryakuNoSenkyu: {
                let found = false;
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (Math.abs(skillOwner.posX - unit.posX) <= 1 ||
                        Math.abs(skillOwner.posY - unit.posY) <= 1) {
                        found = true;
                        unit.reserveToApplyDefDebuff(-7);
                    }
                }
                if (found) {
                    skillOwner.reserveToApplyAtkBuff(6);
                }
            }
                break;
            case Weapon.MagicalLanternPlus:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                }
                break;
            case Weapon.CelestialGlobe: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    found = true;
                    unit.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                    unit.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                }
                if (found) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                }
            }
                break;
            case Weapon.GuidesHourglass:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Dodge);
                }
                break;
            case Weapon.CrowsCrystal:
                if (skillOwner.restHpPercentageAtBeginningOfTurn >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Desperation);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.TotalPenaltyDamage);
                }
                break;
            case Weapon.ChildsCompass:
                if (skillOwner.restHpPercentageAtBeginningOfTurn >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Special.NjorunsZeal2:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case Weapon.InseverableSpear:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                        unit.reserveToAddStatusEffect(StatusEffectType.DualStrike);
                    }
                }
                break;
            case Weapon.ShintakuNoBreath:
                if (skillOwner.isWeaponSpecialRefined) {
                    let found = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        found = true;
                        unit.applyBuffs(0, 0, 6, 6);
                        unit.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                    }
                }
                break;
            case Weapon.ReginRave:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.isEvenTurn) {
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                break;
            case Weapon.Seidr: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    found = true;
                    unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                }
                if (found) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                }
            }
                break;
            case Weapon.ArcaneEclipse:
                if (this.globalBattleContext.currentTurn === 1) { skillOwner.reserveToReduceSpecialCount(1); }
                break;
            case PassiveC.Severance: {
                let found = false;
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (Math.abs(skillOwner.posX - unit.posX) <= 1 ||
                        Math.abs(skillOwner.posY - unit.posY) <= 1) {
                        found = true;
                        unit.reserveToAddStatusEffect(StatusEffectType.Undefended);
                        unit.reserveToAddStatusEffect(StatusEffectType.Feud);
                    }
                }
                if (found) {
                    skillOwner.reservedDebuffFlagsToNeutralize = [true, true, true, true];
                    skillOwner.reserveToNeutralizeNegativeStatusEffects();
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Dodge);
                }
            }
                break;
            case Weapon.CoyotesLance: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                    found = true;
                    unit.applyBuffs(6, 6, 0, 0);
                    unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                }
                if (found) {
                    skillOwner.applyBuffs(6, 6, 0, 0);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                }
            }
                break;
            case Weapon.BladeOfFavors: {
                let found = false;
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (Math.abs(skillOwner.posX - unit.posX) <= 1 ||
                        Math.abs(skillOwner.posY - unit.posY) <= 1) {
                        found = true;
                        unit.reserveToApplyDebuffs(-6, -6, -6, 0);
                    }
                }
                if (found) {
                    skillOwner.applyBuffs(6, 6, 6, 0);
                }
            }
                break;
            case Weapon.WindGenesis:
                if (skillOwner.restHpPercentageAtBeginningOfTurn >= 25) {
                    skillOwner.reserveToApplyAtkBuff(6);
                    skillOwner.reserveToApplySpdBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Desperation);
                }
                break;
            case Weapon.DarkSpikesT:
                if (skillOwner.isWeaponSpecialRefined) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                    skillOwner.reserveTakeDamage(1);
                }
                break;
            case Weapon.KindlingTaiko:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                    unit.reserveToAddStatusEffect(StatusEffectType.Canto1);
                }
                break;
            case Weapon.BreathOfFlame:
                if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case Weapon.BreakerLance: {
                let group = skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally;
                let statusFunc = x => {
                    let unit = this.__getStatusEvalUnit(x);
                    return unit.getAtkInPrecombat() + unit.getDefInPrecombat();
                };
                let units = this.__findMaxStatusUnits(group, statusFunc);
                for (let unit of units) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyDebuffs(-6, 0, -6, 0);
                        u.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
            }
                break;
            case PassiveC.HeirToLight:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToApplyAtkBuff(6);
                    skillOwner.reserveToApplySpdBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                }
                break;
            case PassiveC.OpenedDomain: {
                // 専用スキルでヒーローズ出典が確定なので不要だが念のため
                let ownerOrigin = skillOwner.heroInfo.origin.replace("暗黒竜と光の剣", "紋章の謎");
                let found = false;
                let targetUnits = [];
                units: for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    targetUnits.push(unit);
                    if (unit.heroInfo == null) {
                        throw new Error(`heroInfo is null. name="${unit.name}"`);
                    }
                    for (let origin of unit.heroInfo.origins) {
                        origin = origin.replace("暗黒竜と光の剣", "紋章の謎");
                        if (ownerOrigin.includes(origin)) {
                            // 同じ出典なので次の英雄を探す
                            continue units;
                        }
                    }
                    // 異なる出典のユニットが見つかった
                    found = true;
                }
                if (found) {
                    targetUnits.push(skillOwner); // 自身も対象に
                    targetUnits.forEach(unit => {
                        unit.reserveToAddStatusEffect(StatusEffectType.ResonantBlades);
                        unit.reserveToAddStatusEffect(StatusEffectType.ResonantShield);
                        if (this.__getStatusEvalUnit(unit).isSpecialCountMax) {
                            unit.reserveToReduceSpecialCount(1);
                        }
                    }
                    )
                }
            }
                break;
            case PassiveC.InfNullFollow3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    if (unit.moveType === MoveType.Infantry) {
                        unit.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                    }
                }
                break;
            case Weapon.DivineWhimsy: {
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                let units = [];
                let minSpd = Number.MAX_SAFE_INTEGER;
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    let spd = unit.getSpdInPrecombat();
                    if (spd < minSpd) {
                        units = [unit];
                        minSpd = spd;
                    } else if (spd === minSpd) {
                        units.push(unit);
                    }
                }
                for (let unit of units) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToAddStatusEffect(StatusEffectType.Exposure);
                        u.reserveToAddStatusEffect(StatusEffectType.Stall);
                    }
                }
            }
                break;
            case PassiveC.AssaultTroop3: {
                let found = false;
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (Math.abs(skillOwner.posX - unit.posX) <= 1 ||
                        Math.abs(skillOwner.posY - unit.posY) <= 1) {
                        found = true;
                        break;
                    }
                }
                if (found || skillOwner.restHpPercentageAtBeginningOfTurn === 100) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Charge);
                }
            }
                break;
            case PassiveC.DarklingGuardian:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToApplyDefBuff(6);
                    skillOwner.reserveToApplyResBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.WarpBubble);
                }
                break;
            case PassiveC.FaithInHumanity: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                    if (!isWeaponTypeBreathOrBeast(unit.weaponType)) {
                        found = true;
                        unit.reserveToApplyAtkBuff(6);
                        unit.reserveToApplySpdBuff(6);
                    }
                }
                if (found) {
                    skillOwner.reserveToApplyAtkBuff(6);
                    skillOwner.reserveToApplySpdBuff(6);
                }
                break;
            }
            case Weapon.WildTigerFang:
                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 4)) {
                    unit.reserveToApplyAllDebuff(-6);
                }
                break;
            case Weapon.IcyMaltet:
                if (skillOwner.dragonflower >= 10) {
                    skillOwner.reserveToApplyAtkBuff(6);
                    skillOwner.reserveToApplyDefBuff(6);
                }
                break;
            case PassiveB.TrueDragonWall: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                    if (isWeaponTypeBreathOrBeast(unit.weaponType)) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    skillOwner.reserveHeal(7);
                }
                break;
            }
            case Weapon.SilentPower:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                    if (skillOwner.partnerHeroIndex === unit.heroIndex ||
                        unit.partnerHeroIndex === skillOwner.heroIndex) {
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                        unit.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                    }
                }
                break;
            case Captain.EarthRendering:
                if (2 <= this.globalBattleContext.currentTurn && this.globalBattleContext.currentTurn <= 4
                    && this.map.isUnitOnSummonerDuelsPointArea(skillOwner, this.globalBattleContext.summonerDuelsPointAreaOffset)
                ) {
                    this.globalBattleContext.moveSummonerDuelsPointAreaOffset(skillOwner.groupId);
                }
                break;
            case Captain.AdroitCaptain:
                if (2 <= this.globalBattleContext.currentTurn && this.globalBattleContext.currentTurn <= 5) {
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, true)) {
                        unit.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Captain.Turmoil:
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                break;
            case Captain.MassConfusion:
                if (this.globalBattleContext.isCurrentTurnIn(2, 5)) {
                    this.__applySabotageSkillImpl(
                        skillOwner,
                        unit => true,
                        unit => {
                            unit.reserveToApplyAtkDebuff(-7);
                            unit.reserveToApplyDefDebuff(-7);
                            unit.reserveToApplyResDebuff(-7);
                        });
                }
                break;
            case Captain.RallyingCry:
                if (this.globalBattleContext.isCurrentTurnIn(2, 5)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                            unit.reserveToApplyAllBuffs(6);
                        }
                    }
                }
                break;
            case Weapon.ShadowBreath:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                    unit.reserveToApplyAtkBuff(6);
                    unit.reserveToApplyResBuff(6);
                    unit.reserveToAddStatusEffect(StatusEffectType.EnGarde);
                }
                break;
            case Weapon.FieryBolganone: {
                let found = false;
                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 4)) {
                    found = true;
                    break;
                }
                if (found) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.TotalPenaltyDamage);
                    for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    }
                }
                break;
            }
            case Weapon.ThundererTome:
                if (this.globalBattleContext.currentTurn <= 3 ||
                    skillOwner.restHpPercentageAtBeginningOfTurn <= 99) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case Weapon.FeruniruNoYouran:
                if (skillOwner.isWeaponSpecialRefined) {
                    let count = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        count++;
                        unit.reserveToApplyAtkBuff(6);
                        unit.reserveToApplySpdBuff(6);
                        unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                    }
                    if (count > 0) {
                        skillOwner.reserveToApplyAtkBuff(6);
                        skillOwner.reserveToApplySpdBuff(6);
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                    }
                }
                break;
            case Weapon.SharpWarSword:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.Dodge);
                }
                break;
            case Weapon.AscendingBlade:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case Weapon.DiplomacyStaff: {
                let removedCount = this.globalBattleContext.removedUnitCountsInCombat[skillOwner.groupId];
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                    if (skillOwner.partnerHeroIndex === unit.heroIndex) {
                        unit.reserveToApplyAtkBuff(6);
                        unit.reserveToApplyDefBuff(6);
                        unit.reserveToApplyResBuff(6);
                        unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                        if (removedCount >= 1) {
                            unit.reserveToReduceSpecialCount(2);
                            unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                        }
                    }
                }
                break;
            }
            case Weapon.SeireiNoHogu:
                if (skillOwner.isWeaponSpecialRefined) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                        unit.reserveToApplySpdBuff(6);
                    }
                }
                break;
            case Weapon.MagicRabbits:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
                break;
            case Weapon.BrightShellEgg:
                for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                    unit.reserveToApplySpdDebuff(-6);
                    unit.reserveToApplyResDebuff(-6);
                }
                break;
            case Weapon.TomeOfReason:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToApplyDefBuff(6);
                        unit.reserveToApplyResBuff(6);
                    }
                }
                break;
            case Weapon.MugenNoSyo:
                for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyAtkDebuff(-5);
                        u.reserveToApplyDefDebuff(-5);
                        u.reserveToApplyResDebuff(-5);
                    }
                }
                break;
            case Weapon.DrybladeLance:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
                break;
            case Weapon.ArgentAura:
                for (let unit of this.__findMinStatusUnits(skillOwner.enemyGroupId, x => this.__getStatusEvalUnit(x).getSpdInPrecombat())) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyAllDebuff(-5);
                        u.reserveToAddStatusEffect(StatusEffectType.Stall);
                    }
                }
                break;
            case Weapon.AncientCodex:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.globalBattleContext.currentTurn <= 3) {
                        skillOwner.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.QuickDaggerPlus:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
                break;
            case Weapon.RapidCrierBow:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => { x.reserveToApplyAtkBuff(6); x.reserveToApplySpdBuff(6); }
                );
                break;
            case Weapon.NidavellirLots:
                if (this.globalBattleContext.currentTurn === 4) {
                    skillOwner.reserveToReduceSpecialCount(3);
                }
                break;
            case PassiveC.GoddessBearer:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    skillOwner.reserveToApplyAtkBuff(7);
                    skillOwner.reserveToApplySpdBuff(7);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                }
                break;
            case Weapon.Vorufuberugu:
                if (skillOwner.isWeaponRefined) {
                    let found = false;
                    for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                        found = true;
                    }
                    if (found) {
                        skillOwner.reserveToApplyAllBuffs(4);
                    }
                    if (skillOwner.isWeaponSpecialRefined) {
                        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 4)) {
                            unit.reserveToApplyAtkDebuff(-7);
                            unit.reserveToApplyDefDebuff(-7);
                            unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                            found = true;
                        }
                    }
                }
                break;
            case Special.LifeUnending:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(5);
                }
                break;
            case Weapon.Roputous:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applySabotageSkill(skillOwner, unit => {
                        unit.reserveToApplyAtkDebuff(-5);
                        unit.reserveToApplyResDebuff(-5);
                    }, 1);
                }
                break;
            case Weapon.Laevatein:
                if (skillOwner.isWeaponSpecialRefined) {
                    let found = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        found = true;
                        if (skillOwner.partnerHeroIndex === unit.heroIndex) {
                            unit.reserveToApplyAtkBuff(6);
                            unit.reserveToApplyDefBuff(6);
                        }
                    }
                    if (found) {
                        skillOwner.reserveToApplyAtkBuff(6);
                        skillOwner.reserveToApplyDefBuff(6);
                    }
                }
                break;
            case Weapon.Sangurizuru:
                if (skillOwner.isWeaponSpecialRefined) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (skillOwner.posX - 1 <= unit.posX && unit.posX <= skillOwner.posX + 1 ||
                            skillOwner.posY - 1 <= unit.posY && unit.posY <= skillOwner.posY + 1) {
                            unit.reserveToApplyDefDebuff(-7);
                            unit.reserveToApplyResDebuff(-7);
                        }
                    }
                }
                break;
            case Weapon.RyukenFalcion:
                if (skillOwner.isWeaponRefined) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Weapon.RauarLionPlus:
            case Weapon.BlarLionPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    unit.reserveToApplyAtkBuff(6);
                }
                break;
            case Weapon.PunishmentStaff:
                if (!skillOwner.isWeaponSpecialRefined) break;
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.CancelAffinity);
                        unit.reserveToApplyAtkBuff(6);
                    }
                }
                break;
            case Weapon.EbonPirateClaw:
                this.__applySabotageSkill(skillOwner, unit => {
                    unit.reserveToApplyDefDebuff(-7);
                    unit.reserveToApplyResDebuff(-7);
                }, 1);
                break;
            case PassiveC.StallPloy3:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp <= this.__getStatusEvalUnit(skillOwner).hp - 1,
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Stall));
                break;
            case Weapon.ShellpointLancePlus:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 3)) {
                    skillOwner.reserveToApplyDefBuff(6);
                }
                break;
            case Weapon.TridentPlus:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 3)) {
                    skillOwner.reserveToApplyAtkBuff(6);
                }
                break;
            case Weapon.WeddingBellAxe:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                        unit.reserveToAddStatusEffect(StatusEffectType.TriangleAttack);
                    }
                }
                break;
            case Special.ShiningEmblem:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    skillOwner.reserveToApplyAllBuffs(6);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                        unit.reserveToApplyAtkBuff(6);
                    }
                }
                break;
            case PassiveC.AtkSpdMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.reserveToApplyAtkBuff(6);
                        unit.reserveToApplySpdBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    });
                break;
            case PassiveC.AtkResMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.reserveToApplyAtkBuff(6);
                        unit.reserveToApplyResBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    });
                break;
            case PassiveC.AtkDefMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.reserveToApplyAtkBuff(6);
                        unit.reserveToApplyDefBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplyDefDebuff(-6);
                    });
                break;
            case PassiveC.SpdDefMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.reserveToApplySpdBuff(6);
                        unit.reserveToApplyDefBuff(6);
                    },
                    unit => {
                        unit.reserveToApplySpdDebuff(-6);
                        unit.reserveToApplyDefDebuff(-6);
                    });
                break;
            case PassiveC.SpdResMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.reserveToApplySpdBuff(6);
                        unit.reserveToApplyResBuff(6);
                    },
                    unit => {
                        unit.reserveToApplySpdDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    });
                break;
            case PassiveC.DefResMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.reserveToApplyDefBuff(6);
                        unit.reserveToApplyResBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyDefDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    });
                break;
            case PassiveC.SurtrsPortent:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.reserveToApplyAtkBuff(5);
                        unit.reserveToApplySpdBuff(5);
                        unit.reserveToApplyDefBuff(5);
                        unit.reserveToApplyResBuff(5);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-5);
                        unit.reserveToApplySpdDebuff(-5);
                        unit.reserveToApplyDefDebuff(-5);
                        unit.reserveToApplyResDebuff(-5);
                    });
                break;
            case Special.HolyKnightAura:
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                break;
            case Weapon.GrimasTruth:
                if (skillOwner.isWeaponRefined) {
                    let enemies = this.__findNearestEnemies(skillOwner, 4);
                    if (enemies.length > 0) {
                        for (let unit of enemies) {
                            unit.reserveToApplyAtkDebuff(-5);
                            unit.reserveToApplySpdDebuff(-5);
                            unit.reserveToApplyResDebuff(-5);
                        }
                        skillOwner.reserveToApplyAtkBuff(5);
                        skillOwner.reserveToApplySpdBuff(5);
                        skillOwner.reserveToApplyResBuff(5);
                    }
                }
                break;
            case Weapon.Shamsir:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                        this.writeDebugLog(skillOwner.getNameWithGroup() + "はシャムシールを発動");
                        skillOwner.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.StaffOfRausten:
                for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                    unit.reserveToApplyResDebuff(-6);
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }
                break;
            case Weapon.BansheeTheta:
                if (this.globalBattleContext.currentTurn === 3
                    || this.globalBattleContext.currentTurn === 4
                ) {
                    for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                        unit.reserveToApplyAllDebuff(-6);
                        unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                        unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                }
                break;
            case Special.RadiantAether2:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
                break;
            case Weapon.FellCandelabra:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-6); });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-6); });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-6); });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-6); });
                break;
            case Weapon.Petrify: {
                if (this.globalBattleContext.currentTurn < 1 || 5 < this.globalBattleContext.currentTurn) break;
                const statusFunctions = [
                    x => this.__getStatusEvalUnit(x).hp,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => this.__getStatusEvalUnit(x).getResInPrecombat(),
                ];
                for (let unit of this.__findMinStatusUnits(skillOwner.enemyGroupId, statusFunctions[this.globalBattleContext.currentTurn - 1])) {
                    unit.reserveToApplyAtkDebuff(-7);
                    unit.reserveToApplySpdDebuff(-7);
                    unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                }
                break;
            }
            case Weapon.TrueLoveRoses:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveC.OddRecovery1:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reservedDebuffFlagsToNeutralize = [true, true, true, true];
                        unit.reserveToNeutralizeNegativeStatusEffects();
                    }
                }
                break;
            case PassiveC.OddRecovery2:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reservedDebuffFlagsToNeutralize = [true, true, true, true];
                        unit.reserveToNeutralizeNegativeStatusEffects();
                    }
                }
                break;
            case PassiveC.OddRecovery3:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reservedDebuffFlagsToNeutralize = [true, true, true, true];
                        unit.reserveToNeutralizeNegativeStatusEffects();
                    }
                }
                break;
            case PassiveC.EvenRecovery1:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reservedDebuffFlagsToNeutralize = [true, true, true, true];
                        unit.reserveToNeutralizeNegativeStatusEffects();
                    }
                }
                break;
            case PassiveC.EvenRecovery2:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reservedDebuffFlagsToNeutralize = [true, true, true, true];
                        unit.reserveToNeutralizeNegativeStatusEffects();
                    }
                }
                break;
            case PassiveC.EvenRecovery3:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reservedDebuffFlagsToNeutralize = [true, true, true, true];
                        unit.reserveToNeutralizeNegativeStatusEffects();
                    }
                }
                break;
            case Special.BrutalShell:
            case Special.SeidrShell:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(3);
                }
                break;
            case PassiveC.OddTempest3:
                if (this.isOddTurn) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveC.EvenTempest3:
                if (!this.isOddTurn) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveC.MilaNoHaguruma:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit =>
                        this.__getStatusEvalUnit(unit).getDefInPrecombat() <
                        this.__getStatusEvalUnit(skillOwner).getDefInPrecombat(),
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Isolation));
                break;
            case PassiveC.MilasTurnwheel2:
                skillOwner.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackMinus);
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit =>
                        this.__getStatusEvalUnit(unit).getDefInPrecombat() <
                        this.__getStatusEvalUnit(skillOwner).getDefInPrecombat(),
                    unit => {
                        unit.reserveToAddStatusEffect(StatusEffectType.Isolation);
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                );
                break;
            case Weapon.Gjallarbru:
                if (!skillOwner.isWeaponRefined) {
                    // <通常効果>
                    this.__applySkillToEnemiesInCross(skillOwner,
                        unit => this.__getStatusEvalUnit(unit).hp <= this.__getStatusEvalUnit(skillOwner).hp - 3,
                        unit => unit.reserveToAddStatusEffect(StatusEffectType.Isolation));
                } else {
                    // <錬成効果>
                    this.__applySkillToEnemiesInCross(skillOwner,
                        unit => this.__getStatusEvalUnit(unit).hp <= this.__getStatusEvalUnit(skillOwner).hp - 1,
                        unit => unit.reserveToAddStatusEffect(StatusEffectType.Isolation));
                }
                break;
            case Weapon.SerujuNoKyoufu:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applySkillToEnemiesInCross(skillOwner,
                        unit => this.__getStatusEvalUnit(unit).hp < this.__getStatusEvalUnit(skillOwner).hp,
                        unit => unit.reserveToAddStatusEffect(StatusEffectType.Panic));
                }
                break;
            case PassiveC.KyokoNoKisaku3:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp < this.__getStatusEvalUnit(skillOwner).hp,
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Panic));
                break;
            case Weapon.Sekku: {
                let units = this.enumerateUnitsWithinSpecifiedRange(skillOwner.posX, skillOwner.posY,
                    skillOwner.enemyGroupId, 1, 99);

                if (!skillOwner.isWeaponRefined) {
                    for (let unit of units) {
                        let hpDiff = this.__getStatusEvalUnit(skillOwner).hp - this.__getStatusEvalUnit(unit).hp;
                        if (unit.isRangedWeaponType() && hpDiff >= 3) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                } else {
                    for (let unit of units) {
                        let hpDiff = this.__getStatusEvalUnit(skillOwner).hp - this.__getStatusEvalUnit(unit).hp;
                        if (unit.isMeleeWeaponType() && hpDiff >= 1) {
                            unit.reserveToApplyAtkDebuff(-7);
                            unit.reserveToAddStatusEffect(StatusEffectType.Stall);
                        }
                        if (unit.isRangedWeaponType() && hpDiff >= 1) {
                            unit.reserveToApplyResDebuff(-7);
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                    if (skillOwner.isWeaponSpecialRefined) {
                        for (let unit of this.__findMinStatusUnits(
                            skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                            x => this.__getStatusEvalUnit(x).getSpdInPrecombat())
                        ) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                            for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
                                u.reserveToAddStatusEffect(StatusEffectType.Guard);
                            }
                        }
                    }
                }
            }
                break;
            case Weapon.Mafu:
                if (this.globalBattleContext.currentTurn === 3) {
                    let amount = skillOwner.isWeaponRefined ? 7 : 5;
                    let units = this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, skillOwner.enemyGroupId, amount, 99);
                    for (let unit of units) {
                        if (isWeaponTypeTome(unit.weaponType)) {
                            continue;
                        }
                        unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                    }
                }
                break;
            case Weapon.ElenasStaff:
                for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                    unit.reserveToApplyAtkDebuff(-7);
                    unit.reserveToApplySpdDebuff(-7);

                    if (skillOwner.isWeaponSpecialRefined) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.Hyoushintou: {
                let amount = skillOwner.isWeaponRefined ? -6 : -4;
                for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                    unit.reserveToApplyAllDebuff(amount);
                }
                break;
            }
            case Weapon.JinroMusumeNoTsumekiba:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(2);
                    for (let unit of this.__getPartnersInSpecifiedRange(skillOwner, 100)) {
                        unit.reserveToReduceSpecialCount(2);
                    }
                }
                if (skillOwner.isWeaponSpecialRefined) {
                    let found = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                        if (unit.partnerHeroIndex === skillOwner.heroIndex ||
                            skillOwner.partnerHeroIndex === unit.heroIndex) {
                            found = true;
                            unit.reserveToApplyAtkBuff(6);
                            unit.reserveToApplySpdBuff(6);
                            unit.reserveToAddStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                        }
                    }
                    if (found) {
                        skillOwner.reserveToApplyAtkBuff(6);
                        skillOwner.reserveToApplySpdBuff(6);
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
                    }
                }
                break;
            case Weapon.GroomsWings:
                if (this.globalBattleContext.currentTurn === 1) {
                    for (let unit of this.__getPartnersInSpecifiedRange(skillOwner, 100)) {
                        unit.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.Merikuru: {
                let refined = skillOwner.isWeaponRefined;
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= refined ? 25 : 50) {
                    let units = this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true);
                    for (let unit of units) {
                        if (isPhysicalWeaponType(unit.weaponType)) {
                            unit.reserveToApplyAllBuffs(refined ? 6 : 4);
                        }
                    }
                }
            }
                break;
            case Weapon.HyosyoNoBreath:
                this.__applyHyosyoNoBreath(skillOwner);
                break;
            case PassiveB.KodoNoHukanGusu3:
                if (this.globalBattleContext.currentTurn % 2 === 0) {
                    this.__applyPlusTie(skillOwner);
                }
                break;
            case PassiveB.OddPulseTie3:
                if (this.isOddTurn) {
                    this.__applyPlusTie(skillOwner);
                }
                break;
            case Weapon.DevilAxe:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                        if (isNormalAttackSpecial(skillOwner.special)) {
                            skillOwner.reserveToReduceSpecialCount(1);
                        }
                    }
                }
                break;
            case Weapon.Toron:
            case Weapon.KyoufuArmars:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                    if (isNormalAttackSpecial(skillOwner.special)) {
                        skillOwner.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.Scadi: {
                let turnCond = skillOwner.isWeaponRefined ?
                    this.globalBattleContext.currentTurn === 2 || this.globalBattleContext.currentTurn === 3 :
                    this.globalBattleContext.currentTurn === 3;
                if (turnCond) {
                    let groupId = UnitGroupType.Enemy;
                    if (skillOwner.groupId == UnitGroupType.Enemy) {
                        groupId = UnitGroupType.Ally;
                    }
                    let units = this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, groupId, 3, 99);
                    for (let unit of units) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            }
            case Weapon.Forukuvangu:
                if (!skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                        skillOwner.reserveToApplyAtkBuff(5);
                    }
                }
                break;
            case Weapon.MagoNoTePlus:
                if (this.globalBattleContext.currentTurn === 1) {
                    for (let unit of this.__findMaxStatusUnits(skillOwner.groupId, x => this.__getStatusEvalUnit(x).getAtkInPrecombat(), skillOwner)) {
                        unit.reserveToReduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.NorenPlus:
            case Weapon.KinchakubukuroPlus:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(2);
                }
                break;
            case Weapon.MoonlightStone:
            case PassiveB.TateNoKodo3:
                if (this.globalBattleContext.currentTurn === 1) {
                    if (isDefenseSpecial(skillOwner.special)) {
                        skillOwner.reserveToReduceSpecialCount(2);
                    }
                }
                break;
            case PassiveB.Ikari3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveB.ToketsuNoHuin:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.__findMinStatusUnits(
                        skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                        x => this.__getStatusEvalUnit(x).getResInPrecombat())
                    ) {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    }
                }
                break;
            case PassiveB.FreezingSeal2: {
                let group = skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally;
                let minUnits = this.__findMinStatusUnits(group, x => this.__getStatusEvalUnit(x).getResInPrecombat());
                for (let unit of minUnits) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyAtkDebuff(-7);
                        u.reserveToApplyDefDebuff(-7);
                        u.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                }
            }
                break;
            case PassiveB.KoriNoHuin:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.__findMinStatusUnits(
                        skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                        x => this.__getStatusEvalUnit(x).getDefInPrecombat())
                    ) {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    }
                }
                break;
            case PassiveB.ChillingSeal2:
                for (let unit of this.__findMinStatusUnits(
                    skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                    x => this.__getStatusEvalUnit(x).getDefInPrecombat())
                ) {
                    unit.reserveToApplyAllDebuff(-7);
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                        u.reserveToApplyAtkDebuff(-7);
                        u.reserveToApplyResDebuff(-7);
                    }
                }
                break;
            case PassiveC.InbornIdealism:
            case PassiveC.VisionOfArcadia2:
                if (this.__isThereAnyAllyUnit(skillOwner, x => isWeaponTypeBreathOrBeast(x.weaponType))) {
                    let units = this.__findMaxStatusUnits(
                        skillOwner.groupId,
                        x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                        skillOwner);
                    units.push(skillOwner);
                    for (let unit of units) {
                        unit.reserveToApplyBuffs(6, 6, 6, 0);
                        unit.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                        if (skillId === PassiveC.VisionOfArcadia2) {
                            unit.reserveToAddStatusEffect(StatusEffectType.Canto1);
                        }
                        if (skillId === PassiveC.InbornIdealism) {
                            unit.reserveToAddStatusEffect(StatusEffectType.BonusDoubler);
                        }
                    }
                }
                break;
            case PassiveC.VisionOfArcadia:
                if (this.__isThereAnyAllyUnit(skillOwner, x => isWeaponTypeBreathOrBeast(x.weaponType))) {
                    for (let unit of this.__findMaxStatusUnits(
                        skillOwner.groupId,
                        x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                        skillOwner)
                    ) {
                        unit.reserveToApplyBuffs(6, 0, 6, 0);
                    }
                }
                break;
            case Weapon.ArdentDurandal:
                if (skillOwner.isWeaponRefined) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.BonusDoubler);
                }
                for (let unit of this.__findMaxStatusUnits(
                    skillOwner.groupId,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    skillOwner)
                ) {
                    unit.reserveToAddStatusEffect(StatusEffectType.BonusDoubler);
                }
                break;
            case Weapon.DemonicTome:
            case PassiveC.HajimariNoKodo3:
            case PassiveC.TimesPulse4:
                if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                    this.writeDebugLog(`${skillOwner.getNameWithGroup()}は始まりの鼓動(skillId: ${skillId})を発動`);
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveC.OstiasPulse2:
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, true)) {
                    if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                        unit.reserveToReduceSpecialCount(1);
                        unit.reserveToApplyDefBuff(6);
                        unit.reserveToApplyResBuff(6);
                    }
                }
                break;
            case PassiveC.OstiasPulse:
                if (this.globalBattleContext.currentTurn == 1) {
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                        if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                            unit.reserveToReduceSpecialCount(1);
                        }
                    }
                }
                break;
            case Weapon.RantanNoTsuePlus:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    x => { x.reserveToApplyResBuff(5); x.reserveToApplyDefBuff(5); });
                break;
            case Weapon.YujoNoHanaNoTsuePlus:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => { x.reserveToApplyAtkBuff(5); x.reserveToApplyDefBuff(5); });
                break;
            case PassiveC.AtkOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getAtkInPrecombat(), x => x.reserveToApplyAtkBuff(6));
                break;
            case PassiveC.SpdOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getSpdInPrecombat(), x => x.reserveToApplySpdBuff(6));
                break;
            case PassiveC.DefOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getDefInPrecombat(), x => x.reserveToApplyDefBuff(6));
                break;
            case PassiveC.ResOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getResInPrecombat(), x => x.reserveToApplyResBuff(6));
                break;
            case PassiveC.SpdDefGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat() + this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => { x.reserveToApplySpdBuff(5); x.reserveToApplyDefBuff(5); }
                );
                break;
            case PassiveC.SpdResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.reserveToApplySpdBuff(5); x.reserveToApplyResBuff(5); }
                );
                break;
            case PassiveC.AtkResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.reserveToApplyAtkBuff(5); x.reserveToApplyResBuff(5); }
                );
                break;
            case PassiveC.AtkDefGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => { x.reserveToApplyAtkBuff(5); x.reserveToApplyDefBuff(5); }
                );
                break;
            case PassiveC.DefResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getDefInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.reserveToApplyDefBuff(5); x.reserveToApplyResBuff(5); }
                );
                break;
            case PassiveC.AtkSpdGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => { x.reserveToApplyAtkBuff(5); x.reserveToApplySpdBuff(5); }
                );
                break;
            case PassiveC.SpdDefOath3: this.__applyOathSkill(skillOwner, x => { x.reserveToApplyDefBuff(5); x.reserveToApplySpdBuff(5); }); break;
            case PassiveC.SpdResOath3: this.__applyOathSkill(skillOwner, x => { x.reserveToApplyResBuff(5); x.reserveToApplySpdBuff(5); }); break;
            case PassiveC.AtkSpdOath3: this.__applyOathSkill(skillOwner, x => { x.reserveToApplyAtkBuff(5); x.reserveToApplySpdBuff(5); }); break;
            case PassiveC.AtkSpdOath4: this.__applyOath4Skill(skillOwner, x => { x.reserveToApplyAtkBuff(6); x.reserveToApplySpdBuff(6); }); break;
            case PassiveC.AtkDefOath3: this.__applyOathSkill(skillOwner, x => { x.reserveToApplyAtkBuff(5); x.reserveToApplyDefBuff(5); }); break;
            case PassiveC.AtkResOath3: this.__applyOathSkill(skillOwner, x => { x.reserveToApplyAtkBuff(5); x.reserveToApplyResBuff(5); }); break;
            case PassiveC.AtkResOath4: this.__applyOath4Skill(skillOwner, x => { x.applyAtkBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.DefResOath3: this.__applyOathSkill(skillOwner, x => { x.applyDefBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.UpheavalPlus:
                if (this.globalBattleContext.currentTurn === 1) {
                    if (this.globalBattleContext.isAstraSeason) {
                        if (skillOwner.groupId === UnitGroupType.Enemy) {
                            let minDistance = Number.MAX_SAFE_INTEGER;
                            let structures = [];
                            for (let st of this.map.enumerateObjs(x => x instanceof OffenceStructureBase && x.isBreakable)) {
                                let distance = Math.abs(st.posX - skillOwner.posX) + Math.abs(st.posY - skillOwner.posY);
                                if (distance === minDistance) {
                                    structures.push(st);
                                } else if (distance < minDistance) {
                                    minDistance = distance;
                                    structures = [st];
                                }
                            }
                            for (let st of structures) {
                                this.moveStructureToTrashBox(st);
                            }
                        }
                    }
                }
                break;
            case PassiveC.Upheaval:
                if (this.globalBattleContext.currentTurn == 1) {
                    if (this.globalBattleContext.isAstraSeason) {
                        if (skillOwner.groupId == UnitGroupType.Enemy) {
                            for (let st of this.map.enumerateObjs(x => x instanceof OffenceStructureBase && x.isBreakable)) {
                                if (st.posX == skillOwner.posX) {
                                    this.moveStructureToTrashBox(st);
                                    break;
                                }
                            }
                        }
                    }
                }
                break;
            case PassiveC.AirOrders3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    switch (unit.moveType) {
                        case MoveType.Flying:
                            unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                            break;
                    }
                }
                break;
            case PassiveC.GroundOrders3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    switch (unit.moveType) {
                        case MoveType.Infantry:
                        case MoveType.Armor:
                        case MoveType.Cavalry:
                            unit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                            break;
                    }
                }
                break;
            case PassiveC.DivineFang:
            case PassiveC.DivineFangPlus:
                for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                    if (!otherUnit.isOnMap) { continue; }
                    if (skillOwner.isNextTo(otherUnit)) {
                        otherUnit.reserveToAddStatusEffect(StatusEffectType.EffectiveAgainstDragons);
                    }
                }
                if (skillId === PassiveC.DivineFangPlus) {
                    let found = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        found = true;
                        unit.applyBuffs(6, 6, 0, 0);
                        unit.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                    }
                    if (found) {
                        skillOwner.applyBuffs(6, 6, 0, 0);
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.FollowUpAttackPlus);
                    }
                }
                break;
            case PassiveC.SolitaryDream:
                if (!this.__isNextToOtherUnitsExcept(skillOwner, x => isWeaponTypeBreath(x.weaponType))) {
                    skillOwner.applyAllBuff(4);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveC.WithEveryone:
                for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                    if (!otherUnit.isOnMap) { continue; }
                    if (!skillOwner.isNextTo(otherUnit)) { continue; }
                    skillOwner.applyDefBuff(5);
                    skillOwner.applyResBuff(5);
                    otherUnit.applyDefBuff(5);
                    otherUnit.applyResBuff(5);
                }
                break;
            case PassiveC.WithEveryone2: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                    found = true;
                    unit.applyDefBuff(6);
                    unit.applyResBuff(6);
                }
                if (found) {
                    skillOwner.applyDefBuff(6);
                    skillOwner.applyResBuff(6);
                }
            }
                break;
            case PassiveC.SurtrsMenace:
                {
                    let isEnemyInSpaces = false;
                    for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToApplyAllDebuff(-4);
                        isEnemyInSpaces = true;
                    }
                    if (isEnemyInSpaces) {
                        skillOwner.applyAllBuff(4);
                    }
                }
                break;
            case PassiveC.ArmoredStride3:
                if (!this.__isThereAllyInSpecifiedSpaces(skillOwner, 1)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case PassiveS.ArmoredBoots:
                if (this.__getStatusEvalUnit(skillOwner).isFullHp) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
                break;
            case Weapon.FlowerHauteclere:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 25) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.AirOrders);
                }
                break;
            case Weapon.Faraflame:
            case Weapon.GunshinNoSyo:
                if (skillOwner.isWeaponRefined) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (skillOwner.posX - 1 <= unit.posX && unit.posX <= skillOwner.posX + 1 ||
                            skillOwner.posY - 1 <= unit.posY && unit.posY <= skillOwner.posY + 1) {
                            unit.reserveToApplyAtkDebuff(-5);
                            unit.reserveToApplyResDebuff(-5);
                        }
                    }
                } else {
                    this.__applyPolySkill(skillOwner, unit => {
                        unit.reserveToApplyAtkDebuff(-4);
                        unit.reserveToApplyResDebuff(-4);
                    });
                }
                break;
            case Weapon.KatarinaNoSyo:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyPolySkill(skillOwner, unit => {
                        unit.reserveToApplySpdDebuff(-4);
                        unit.reserveToApplyResDebuff(-4);
                    });
                }
                break;
            case PassiveC.AtkPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplyAtkDebuff(-5)); break;
            case PassiveC.SpdPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplySpdDebuff(-5)); break;
            case PassiveC.DefPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplyDefDebuff(-5)); break;
            case PassiveC.ResPloy3: this.__applyPolySkill(skillOwner, unit => unit.reserveToApplyResDebuff(-5)); break;
            case PassiveC.ChaosNamed:
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (skillOwner.posX - 1 <= unit.posX && unit.posX <= skillOwner.posX + 1) {
                        if (this.__getStatusEvalUnit(unit).getEvalResInPrecombat() <= (this.__getStatusEvalUnit(skillOwner).getEvalResInPrecombat() - 3)) {
                            this.__applyDebuffForHighestStatus(unit, -5);
                        }
                    }
                }
                break;
            case PassiveC.ChaosNamedPlus:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => {
                        return this.__getStatusEvalUnit(unit).getAtkInPrecombat()
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-7);
                        for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                            u.reserveToApplyAtkDebuff(-7);
                        }
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => {
                        return this.__getStatusEvalUnit(unit).getSpdInPrecombat()
                    },
                    unit => {
                        unit.reserveToApplySpdDebuff(-7);
                        for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                            u.reserveToApplySpdDebuff(-7);
                        }
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => {
                        return this.__getStatusEvalUnit(unit).getDefInPrecombat()
                    },
                    unit => {
                        unit.reserveToApplyDefDebuff(-7);
                        for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                            u.reserveToApplyDefDebuff(-7);
                        }
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    });
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => {
                        return this.__getStatusEvalUnit(unit).getResInPrecombat()
                    },
                    unit => {
                        unit.reserveToApplyResDebuff(-7);
                        for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2)) {
                            u.reserveToApplyResDebuff(-7);
                        }
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    });
                break;
            case Weapon.AkaNoKen:
            case Weapon.DarkExcalibur:
                if (skillOwner.weaponRefinement == WeaponRefinementType.Special) {
                    if (this.globalBattleContext.currentTurn == 1) { skillOwner.reserveToReduceSpecialCount(2); }
                }
                break;
            case Weapon.Missiletainn:
                if (this.globalBattleContext.currentTurn == 1) {
                    let reduceCount = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, true)) {
                        if (isWeaponTypeTome(unit.weaponType)) {
                            ++reduceCount;
                        }
                    }
                    skillOwner.reserveToReduceSpecialCount(reduceCount);
                }
                break;
            case PassiveC.InfantryPulse4: {
                let skillOwnerHp = skillOwner.maxHpWithSkills;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, true)) {
                    let snapshot = this.__getStatusEvalUnit(unit);
                    if (unit.moveType === MoveType.Infantry &&
                        unit.maxHpWithSkills < skillOwnerHp &&
                        snapshot.isSpecialCountMax ||
                        unit === skillOwner) {
                        this.writeDebugLog(`${skillOwner.getNameWithGroup()}の${skillOwner.passiveCInfo.name}により${unit.getNameWithGroup()}の奥義発動カウント-1`);
                        unit.reserveToReduceSpecialCount(1);
                    }
                }
            }
                break;
            case PassiveC.HokoNoKodo3:
                if (this.globalBattleContext.currentTurn == 1) {
                    // なぜか skillOwner の snapshot が for の中でだけ null になる
                    let skillOwnerHp = this.__getStatusEvalUnit(skillOwner).hp;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner)) {
                        if (unit.moveType == MoveType.Infantry
                            && this.__getStatusEvalUnit(unit).hp < skillOwnerHp
                        ) {
                            this.writeDebugLog(skillOwner.getNameWithGroup() + "の歩行の鼓動3により" + unit.getNameWithGroup() + "の奥義発動カウント-1");
                            unit.reserveToReduceSpecialCount(1);
                        }
                    }
                }
                break;
            case PassiveB.SDrink:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveS.OgiNoKodou:
                if (this.globalBattleContext.currentTurn === 1) {
                    this.writeDebugLog(skillOwner.getNameWithGroup() + "の奥義の鼓動により奥義発動カウント-1");
                    skillOwner.reserveToReduceSpecialCount(1);
                }
                break;
            case PassiveB.SabotageAtk3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyAtkDebuff(-7); });
                break;
            case PassiveB.SabotageSpd3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplySpdDebuff(-7); });
                break;
            case PassiveB.SabotageDef3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyDefDebuff(-7); });
                break;
            case PassiveB.SabotageRes3:
                this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyResDebuff(-7); });
                break;
            case Weapon.WeirdingTome:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplySpdDebuff(-5); unit.reserveToApplyResDebuff(-5); });
                break;
            case Weapon.TemariPlus:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplySpdDebuff(-5); });
                break;
            case PassiveB.YunesSasayaki:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplyAtkDebuff(-6); unit.reserveToApplySpdDebuff(-6); });
                break;
            case Weapon.KinunNoYumiPlus:
                this.__applySabotageSkill(
                    skillOwner,
                    unit => { unit.reserveToApplyDefDebuff(-5); unit.reserveToApplyResDebuff(-5); });
                break;
            case Weapon.AversasNight: {
                let amount = skillOwner.isWeaponRefined ? -4 : -3;
                this.__applySabotageSkillImpl(
                    skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3),
                    unit => { unit.reserveToApplyAllDebuff(amount); unit.reserveToAddStatusEffect(StatusEffectType.Panic); });
            }
                break;
            case Weapon.KokyousyaNoYari:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applySabotageSkill(skillOwner, unit => { unit.reserveToApplyAtkDebuff(-7); });
                }
                break;
            case Weapon.KizokutekinaYumi:
            case PassiveB.KyokoNoWakuran3:
                {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (!this.__isNextToOtherUnits(unit)) { continue; }
                        if (this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 1)) {
                            this.writeDebugLog(skillOwner.getNameWithGroup() + "はHP" + this.__getStatusEvalUnit(skillOwner).hp + ", "
                                + unit.getNameWithGroup() + "はHP" + this.__getStatusEvalUnit(unit).hp + "で恐慌の惑乱適用");
                            unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                        }
                    }
                }
                break;
            case Weapon.Fensariru:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-4));
                }
                break;
            case Weapon.Ekkezakkusu:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-4));
                } else {
                    this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-6), x => !isWeaponTypeBreath(x.weaponType));
                }
                break;
            case PassiveC.ThreatenAtk1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-3)); break;
            case PassiveC.ThreatenAtk2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-4)); break;
            case PassiveC.ThreatenAtk3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyAtkDebuff(-5)); break;
            case PassiveC.ThreatenSpd1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplySpdDebuff(-3)); break;
            case PassiveC.ThreatenSpd2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplySpdDebuff(-4)); break;
            case PassiveC.ThreatenSpd3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplySpdDebuff(-5)); break;
            case PassiveC.ThreatenDef1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-3)); break;
            case PassiveC.ThreatenDef2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-4)); break;
            case PassiveC.ThreatenDef3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyDefDebuff(-5)); break;
            case PassiveC.ThreatenRes1: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyResDebuff(-3)); break;
            case PassiveC.ThreatenRes2: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyResDebuff(-4)); break;
            case PassiveC.ThreatenRes3: this.__applyThreatenSkill(skillOwner, x => x.reserveToApplyResDebuff(-5)); break;
            case PassiveC.ThreatenAtkSpd2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyAtkDebuff(-4); x.reserveToApplySpdDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenAtkSpd3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.reserveToApplyBuffs(5, 5, 0, 0);
                        x.reserveToApplyAtkDebuff(-5); x.reserveToApplySpdDebuff(-5);
                    });
                break;
            case Weapon.MeikiNoBreath:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyAtkDebuff(-7); x.reserveToApplySpdDebuff(-7);
                    });
                break;
            case PassiveC.ThreatenAtkRes3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applyResBuff(5);
                        x.reserveToApplyAtkDebuff(-5); x.reserveToApplyResDebuff(-5);
                    });
                break;
            case PassiveC.ThreatenAtkRes2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyAtkDebuff(-4); x.reserveToApplyResDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenSpdDef2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplySpdDebuff(-4); x.reserveToApplyDefDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenDefRes2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyDefDebuff(-4); x.reserveToApplyResDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenAtkDef2:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        x.reserveToApplyAtkDebuff(-4); x.reserveToApplyDefDebuff(-4);
                    });
                break;
            case PassiveC.ThreatenAtkDef3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.reserveToApplyBuffs(5, 0, 5, 0);
                        x.reserveToApplyAtkDebuff(-5);
                        x.reserveToApplyDefDebuff(-5);
                    });
                break;
            case Weapon.GunshiNoFusho:
            case Weapon.GunshiNoRaisyo:
                this.__applyTacticSkill(skillOwner, x => { x.applyAllBuff(4); });
                break;
            case PassiveC.AtkTactic1: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(2); }); break;
            case PassiveC.AtkTactic2: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(4); }); break;
            case PassiveC.AtkTactic3: this.__applyTacticSkill(skillOwner, x => { x.applyAtkBuff(6); }); break;
            case PassiveC.OrdersRestraint:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    unit.applyAtkBuff(6);
                    unit.applyResBuff(6);
                    unit.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }

                if (this.__countAlliesWithinSpecifiedSpaces(skillOwner, 2) >= 3) {
                    skillOwner.applyAtkBuff(6);
                    skillOwner.applyResBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
                break;
            case Weapon.ShinginNoSeiken:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(6); });
                }
                break;
            case PassiveC.SpdTactic1: this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(2); }); break;
            case PassiveC.SpdTactic2: this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(4); }); break;
            case PassiveC.SpdTactic3: this.__applyTacticSkill(skillOwner, x => { x.applySpdBuff(6); }); break;
            case PassiveC.DefTactic1: this.__applyTacticSkill(skillOwner, x => { x.applyDefBuff(2); }); break;
            case PassiveC.DefTactic2: this.__applyTacticSkill(skillOwner, x => { x.applyDefBuff(4); }); break;
            case PassiveC.DefTactic3: this.__applyTacticSkill(skillOwner, x => { x.applyDefBuff(6); }); break;
            case PassiveC.InfSpdTactic:
                this.__applyTacticSkill(skillOwner, unit => {
                    unit.applySpdBuff(6);
                    if (unit.moveType === MoveType.Infantry) {
                        unit.reserveToAddStatusEffect(StatusEffectType.NullFollowUp);
                    }
                }); break;
            case Weapon.YoheidanNoSenfu:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(6); });
                }
                break;
            case PassiveC.ResTactic1: this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(2); }); break;
            case PassiveC.ResTactic2: this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(4); }); break;
            case PassiveC.ResTactic3: this.__applyTacticSkill(skillOwner, x => { x.applyResBuff(6); }); break;
            case PassiveC.OddAtkWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applyAtkBuff(6); }); break;
            case PassiveC.OddSpdWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applySpdBuff(6); }); break;
            case PassiveC.OddDefWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applyDefBuff(6); }); break;
            case PassiveC.OddResWave3: this.__applyWaveSkill(skillOwner, 1, x => { x.applyResBuff(6); }); break;
            case Weapon.AirisuNoSyo:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyWaveSkill(skillOwner, 0, x => { x.applyAtkBuff(6); });
                }
                break;
            case PassiveC.EvenAtkWave3:
                this.__applyWaveSkill(skillOwner, 0, x => { x.applyAtkBuff(6); });
                break;
            case PassiveC.EvenSpdWave3: this.__applyWaveSkill(skillOwner, 0, x => { x.applySpdBuff(6); }); break;
            case PassiveC.EvenDefWave3: this.__applyWaveSkill(skillOwner, 0, x => { x.applyDefBuff(6); }); break;
            case PassiveC.EvenResWave3: this.__applyWaveSkill(skillOwner, 0, x => { x.applyResBuff(6); }); break;
            case Weapon.Byureisuto:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyWaveSkill(skillOwner, 1, x => { x.applyAllBuff(4); });
                } else {
                    if (this.__findNearestEnemies(skillOwner, 4).length > 0 || this.globalBattleContext.isOddTurn) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                            unit.applyAllBuff(5);
                        }
                    }
                }
                break;
            case Weapon.Jikurinde:
                if (skillOwner.isWeaponRefined) {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); });
                }
                else {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(3); });
                }
                break;
            case Weapon.AiNoCakeServa:
            case Weapon.AiNoCakeServaPlus:
                this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); skillOwner.applyAtkBuff(4); });
                break;
            case Weapon.KiyorakanaBuke:
            case Weapon.KiyorakanaBukePlus:
                this.__applyHoneSkill(skillOwner, x => true, x => { x.applySpdBuff(4); skillOwner.applySpdBuff(4); });
                break;
            case Weapon.Jikumunt:
                if (!skillOwner.isWeaponRefined) {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(3); });
                } else {
                    this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); });
                }
                break;
            case PassiveC.HoneAtk3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(4); }); break;
            case PassiveC.HoneSpd3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applySpdBuff(4); }); break;
            case PassiveC.HoneDef3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyDefBuff(4); }); break;
            case PassiveC.HoneRes3: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyResBuff(4); }); break;
            case PassiveC.HoneAtk4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyAtkBuff(7); }); break;
            case PassiveC.HoneSpd4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applySpdBuff(7); }); break;
            case PassiveC.HoneDef4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyDefBuff(7); }); break;
            case PassiveC.HoneRes4: this.__applyHoneSkill(skillOwner, x => true, x => { x.applyResBuff(7); }); break;
            case PassiveC.JointHoneAtk:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applyAtkBuff(5); x.applyAtkBuff(5); }); break;
            case PassiveC.JointHoneSpd:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applySpdBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.JointHoneDef:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applyDefBuff(5); x.applyDefBuff(5); }); break;
            case PassiveC.JointHoneRes:
                this.__applyHoneSkill(skillOwner, x => true,
                    x => { skillOwner.applyResBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.HitoNoKanouseiWo:
                this.__applyHoneSkill(skillOwner,
                    x => !isWeaponTypeBreathOrBeast(x.weaponType),
                    x => {
                        skillOwner.applyAtkBuff(6);
                        skillOwner.applySpdBuff(6);
                        x.applyAtkBuff(6);
                        x.applySpdBuff(6);
                    }); break;
            case PassiveC.HumanVirtue2: {
                let found = false;
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    if (!isWeaponTypeBreathOrBeast(unit.weaponType)) {
                        found = true;
                        unit.applyAtkBuff(6);
                        unit.applySpdBuff(6);
                    }
                }
                if (found) {
                    skillOwner.applyAtkBuff(6);
                    skillOwner.applySpdBuff(6);
                }
                break;
            }
            case PassiveC.HoneArmor:
                this.__applyHoneSkill(skillOwner, x => x.moveType === MoveType.Armor, x => x.reserveToApplyBuffs(6, 6, 0, 0));
                break;
            case PassiveC.HoneCavalry:
                this.__applyHoneSkill(skillOwner, x => x.moveType === MoveType.Cavalry, x => x.reserveToApplyBuffs(6, 6, 0, 0));
                break;
            case PassiveC.HoneFlyier:
                this.__applyHoneSkill(skillOwner, x => x.moveType === MoveType.Flying, x => x.reserveToApplyBuffs(6, 6, 0, 0));
                break;
            case PassiveC.HoneDragons:
                this.__applyHoneSkill(skillOwner, x => isWeaponTypeBreath(x.weaponType), x => x.reserveToApplyBuffs(6, 6, 0, 0));
                break;
            case PassiveC.HoneBeasts:
                this.__applyHoneSkill(skillOwner, x => isWeaponTypeBeast(x.weaponType), x => x.reserveToApplyBuffs(6, 6, 0, 0));
                break;
            case PassiveC.FortifyArmor:
                this.__applyHoneSkill(skillOwner, x => x.moveType === MoveType.Armor, x => x.reserveToApplyBuffs(0, 0, 6, 6));
                break;
            case PassiveC.FortifyCavalry:
                this.__applyHoneSkill(skillOwner, x => x.moveType === MoveType.Cavalry, x => x.reserveToApplyBuffs(0, 0, 6, 6));
                break;
            case PassiveC.FortifyFlyier:
                this.__applyHoneSkill(skillOwner, x => x.moveType === MoveType.Flying, x => x.reserveToApplyBuffs(0, 0, 6, 6));
                break;
            case PassiveC.FortifyDragons:
                this.__applyHoneSkill(skillOwner, x => isWeaponTypeBreath(x.weaponType), x => x.reserveToApplyBuffs(0, 0, 6, 6));
                break;
            case PassiveC.FortifyBeasts:
                this.__applyHoneSkill(skillOwner, x => isWeaponTypeBeast(x.weaponType), x => x.reserveToApplyBuffs(0, 0, 6, 6));
                break;
            case Weapon.KyomeiOra:
                this.__applyHoneSkill(skillOwner,
                    x => x.isMeleeWeaponType(),
                    x => { x.applyAtkBuff(6); });
                break;
            case Weapon.Ora:
                if (skillOwner.isWeaponSpecialRefined) {
                    this.__applyHoneSkill(skillOwner,
                        x => x.weaponType == WeaponType.Staff || isWeaponTypeTome(x.weaponType),
                        x => { x.applyAtkBuff(6); });
                }
                break;
            case Weapon.MaskingAxe:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applyDefBuff(6); } break;
                }
                break;
            case PassiveC.RouseAtkSpd3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applySpdBuff(6); } break;
            case PassiveC.RouseAtkDef3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applyDefBuff(6); } break;
            case PassiveC.RouseAtkRes3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyAtkBuff(6); skillOwner.applyResBuff(6); } break;
            case PassiveC.RouseDefRes3:
                if (this.__isSolo(skillOwner)) { skillOwner.applyDefBuff(6); skillOwner.applyResBuff(6); } break;
            case PassiveC.RouseSpdRes3:
                if (this.__isSolo(skillOwner)) { skillOwner.applySpdBuff(6); skillOwner.applyResBuff(6); } break;
            case PassiveC.RouseSpdDef3:
                if (this.__isSolo(skillOwner)) { skillOwner.applySpdBuff(6); skillOwner.applyDefBuff(6); } break;
            case PassiveC.RouseAtkSpd4:
                if (this.__isSolo(skillOwner)) {
                    skillOwner.applyAtkBuff(6);
                    skillOwner.applySpdBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
                break;
            case PassiveC.RouseAtkDef4:
                if (this.__isSolo(skillOwner)) {
                    skillOwner.applyAtkBuff(6);
                    skillOwner.applyDefBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
                break;
            case PassiveC.RouseAtkRes4:
                if (this.__isSolo(skillOwner)) {
                    skillOwner.applyAtkBuff(6);
                    skillOwner.applyResBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
                break;
            case PassiveC.RouseSpdDef4:
                if (this.__isSolo(skillOwner)) {
                    skillOwner.applySpdBuff(6);
                    skillOwner.applyDefBuff(6);
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.NullPanic);
                }
                break;
            case PassiveA.DefiantAtk1:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyAtkBuff(3); }
                break;
            case PassiveA.DefiantAtk2:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyAtkBuff(5); }
                break;
            case PassiveA.DefiantAtk3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyAtkBuff(7); }
                break;
            case PassiveA.DefiantSpd3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applySpdBuff(7); }
                break;
            case PassiveA.DefiantDef3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyDefBuff(7); }
                break;
            case PassiveA.DefiantRes3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) { skillOwner.applyResBuff(7); }
                break;
            case Weapon.FuginNoMaran:
                if (skillOwner.isWeaponRefined) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                        unit => { unit.reserveToApplyAtkDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                        unit => { unit.reserveToApplySpdDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                        unit => { unit.reserveToApplyDefDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                        unit => { unit.reserveToApplyResDebuff(-7); });
                } else {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                        this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                            unit => {
                                return this.__getStatusEvalUnit(unit).getResInPrecombat()
                            },
                            unit => {
                                unit.reserveToApplyAtkDebuff(-5);
                                unit.reserveToApplyDefDebuff(-5);
                            });
                    }
                }
                break;
            case Weapon.RosenshiNoKofu:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                        unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyDefDebuff(-5); });
                }
                break;
            case Weapon.MuninNoMaran:
                if (skillOwner.isWeaponRefined) {
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                        unit => { unit.reserveToApplyAtkDebuff(-7); });
                    this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                        unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                        unit => { unit.reserveToApplyResDebuff(-7); });
                } else {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                        this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                            unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                            unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyResDebuff(-5); });
                    }
                }
                break;
            case PassiveB.ChillAtkDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() + this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyDefDebuff(-5); }); break;
            case PassiveB.ChillAtkRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() + this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplyResDebuff(-5); }); break;
            case PassiveB.ChillAtkSpd2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() + this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveB.ChillSpdDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() + this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveB.ChillSpdRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() + this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveB.ChillDefRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() + this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-5); unit.reserveToApplyResDebuff(-5); }); break;
            case PassiveB.ChillAtk1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-3); }); break;
            case PassiveB.ChillAtk2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); }); break;
            case Weapon.SyungeiNoKenPlus:
            case Weapon.WindsBrand:
            case PassiveB.ChillAtk3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getAtkInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-7); }); break;
            case PassiveB.ChillSpd1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-3); }); break;
            case PassiveB.ChillSpd2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-5); }); break;
            case Weapon.TekiyaPlus:
            case PassiveB.ChillSpd3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getSpdInPrecombat() },
                    unit => { unit.reserveToApplySpdDebuff(-7); }); break;
            case PassiveB.ChillDef1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-3); }); break;
            case PassiveB.ChillDef2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-5); }); break;
            case PassiveB.ChillAtkRes3: {
                let group = skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally;
                let statusFunc = x => {
                    let unit = this.__getStatusEvalUnit(x);
                    return unit.getAtkInPrecombat() + unit.getResInPrecombat();
                };
                let units = this.__findMaxStatusUnits(group, statusFunc);
                for (let unit of units) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyDebuffs(-6, 0, 0, -6);
                    }
                }
            }
                break;
            case PassiveB.ChillSpdRes3: {
                let group = skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally;
                let statusFunc = x => {
                    let unit = this.__getStatusEvalUnit(x);
                    return unit.getSpdInPrecombat() + unit.getResInPrecombat();
                };
                let units = this.__findMaxStatusUnits(group, statusFunc);
                for (let unit of units) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyDebuffs(0, -6, 0, -6);
                    }
                }
            }
                break;
            case PassiveB.ChillDefRes3: {
                let group = skillOwner.groupId === UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally;
                let statusFunc = x => {
                    let unit = this.__getStatusEvalUnit(x);
                    return unit.getDefInPrecombat() + unit.getResInPrecombat();
                };
                let units = this.__findMaxStatusUnits(group, statusFunc);
                for (let unit of units) {
                    for (let u of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 2, true)) {
                        u.reserveToApplyDebuffs(0, 0, -6, -6);
                    }
                }
            }
                break;
            case Weapon.WagasaPlus:
            case Weapon.GinNoHokyu:
            case PassiveB.ChillDef3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyDefDebuff(-7); }); break;
            case PassiveB.ChillRes1:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-3); }); break;
            case PassiveB.ChillRes2:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-5); }); break;
            case Weapon.Forblaze:
            case PassiveB.ChillRes3:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getResInPrecombat() },
                    unit => { unit.reserveToApplyResDebuff(-7); }); break;
            case Weapon.KumadePlus:
                this.__applyDebuffToMaxStatusUnits(skillOwner.enemyGroupId,
                    unit => { return this.__getStatusEvalUnit(unit).getDefInPrecombat() },
                    unit => { unit.reserveToApplyAtkDebuff(-5); unit.reserveToApplySpdDebuff(-5); }); break;
            case PassiveC.ArmorMarch3:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    if (unit.moveType === MoveType.Armor) {
                        this.writeLog(unit.getNameWithGroup() + "は重装の行軍により移動値+1");
                        unit.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                        this.writeLog(skillOwner.getNameWithGroup() + "は重装の行軍により移動値+1");
                        skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                    }
                }
                break;
            case Weapon.EternalBreath:
                {
                    let isAllyAvailable = false;
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                        unit.applyAllBuff(5);
                        isAllyAvailable = true;
                    }
                    if (isAllyAvailable) {
                        skillOwner.applyAllBuff(5);
                    }
                }
                break;
            case Captain.Dauntless:
                if (skillOwner.isCaptain
                    && 2 <= this.globalBattleContext.currentTurn && this.globalBattleContext.currentTurn <= 5
                ) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 3, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.SpecialCooldownChargePlusOnePerAttack);
                    }
                    this.__applySkillToEnemiesInCross(skillOwner,
                        unit => true,
                        unit => unit.reserveToAddStatusEffect(StatusEffectType.Guard));
                }
                break;
        }
    }

    applyEnemySkillForBeginningOfTurn(skillId, skillOwner) {
        if (skillOwner.hasStatusEffect(StatusEffectType.FalseStart)) return;

        getSkillFunc(skillId, applyEnemySkillForBeginningOfTurnFuncMap)?.call(this, skillOwner);
        switch (skillId) {
            case Weapon.InspiritedSpear:
                for (let enemyUnit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (skillOwner.isInCrossWithOffset(enemyUnit, 1)) {
                        enemyUnit.reserveToAddStatusEffect(StatusEffectType.Guard);
                        if (isNormalAttackSpecial(enemyUnit.special) &&
                            enemyUnit.statusEvalUnit.specialCount <= 1 &&
                            skillOwner.isHigherDefInPrecombat(enemyUnit)) {
                            enemyUnit.reserveToIncreaseSpecialCount(1);
                        }
                    }
                }
                break;
            case PassiveC.DreamDeliverer:
                if (this.__isThereAllyIn2Spaces(skillOwner)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.battleContext.neutralizesAnyPenaltyWhileBeginningOfTurn = true;
                    }
                }
                break;
            case Weapon.DuskbloomBow:
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (skillOwner.posX === unit.posX ||
                        skillOwner.posY === unit.posY) {
                        if (unit.getEvalResInPrecombat() < skillOwner.getEvalResInPrecombat()) {
                            unit.reserveToApplyDebuffs(0, 0, -7, -7);
                            unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                        }
                    }
                }
                break;
            case Weapon.BladeOfFavors: {
                let found = false;
                for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                    if (Math.abs(skillOwner.posX - unit.posX) <= 1 ||
                        Math.abs(skillOwner.posY - unit.posY) <= 1) {
                        found = true;
                        unit.reserveToApplyDebuffs(-6, -6, -6, 0);
                    }
                }
                if (found) {
                    skillOwner.applyBuffs(6, 6, 6, 0);
                }
            }
                break;
        }
    }

    applySkillAfterEnemySkillsForBeginningOfTurn(skillId, skillOwner) {
        getSkillFunc(skillId, applySkillAfterEnemySkillsForBeginningOfTurnFuncMap)?.call(this, skillOwner);
        switch (skillId) {
            case PassiveC.FutureFocused:
                if (this.isOddTurn) {
                    let enemyUnits = this.enumerateUnitsInDifferentGroupOnMap(skillOwner);
                    let unitsInCross = GeneratorUtil.filter(enemyUnits, u => skillOwner.isInCrossOf(u));
                    let nearestUnits= IterUtil.minElements(unitsInCross, u => skillOwner.distance(u));
                    let lowerRes = u => skillOwner.isHigherResInPrecombat(u, u.distance(skillOwner) * 3);
                    nearestUnits.filter(lowerRes).forEach(u => u.endActionBySkillEffect());
                }
                break;
        }
    }

    /**
     * ターン開始時スキル発動後に発動するスキル
     * エリミーヌのターン開始時スキル不可効果(FalseStart)を受けない
     * @param {number|string} skillId
     * @param {Unit} skillOwner
     */
    applySkillAfterSkillsForBeginningOfTurn(skillId, skillOwner) {
        getSkillFunc(skillId, applySkillAfterSkillsForBeginningOfTurnFuncMap)?.call(this, skillOwner);
        switch (skillId) {
            case Weapon.TomeOfLaxuries:
                if (skillOwner.battleContext.restHpPercentage >= 25) {
                    let positiveEffects = skillOwner.getPositiveStatusEffects().filter(
                        effect =>
                            effect !== StatusEffectType.MobilityIncreased &&
                            effect !== StatusEffectType.Pathfinder
                    );
                    for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        positiveEffects.forEach(e => ally.reserveToAddStatusEffect(e));
                        // 自身がパニック時は味方に強化は付与されない
                        ally.reserveToApplyBuffs(
                            skillOwner.getAtkBuff(),
                            skillOwner.getSpdBuff(),
                            skillOwner.getDefBuff(),
                            skillOwner.getResBuff()
                        );
                    }
                }
                break;
            case PassiveC.FettersOfDromi:
                if (skillOwner.hasStatusEffect(StatusEffectType.Stall)) {
                    skillOwner.reservedStatusEffectSetToNeutralize.add(StatusEffectType.MobilityIncreased);
                }
                break;
        }
    }

    applyHpSkillForBeginningOfTurn(skillId, skillOwner) {
        // ターン開始スキル不可である場合は処理を終える
        if (skillOwner.hasStatusEffect(StatusEffectType.FalseStart)) return;
        this.applyHealSkillForBeginningOfTurn(skillId, skillOwner);
        this.applyDamageSkillForBeginningOfTurn(skillId, skillOwner);
    }

    applyHealSkillForBeginningOfTurn(skillId, skillOwner) {
        getSkillFunc(skillId, applyHealSkillForBeginningOfTurnFuncMap)?.call(this, skillOwner);
        this.#applyHealSkillForBeginningOfTurn(skillId, skillOwner);
    }

    #applyHealSkillForBeginningOfTurn(skillId, skillOwner) {
        switch (skillId) {
            case Weapon.DriftingGracePlus:
            case Weapon.LuminousGracePlus:
                skillOwner.reserveHeal(10);
                break;
            case PassiveC.OddRecovery1:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveHeal(5);
                    }
                }
                break;
            case PassiveC.OddRecovery2:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveHeal(10);
                    }
                }
                break;
            case PassiveC.OddRecovery3:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveHeal(20);
                    }
                }
                break;
            case PassiveC.EvenRecovery1:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveHeal(5);
                    }
                }
                break;
            case PassiveC.EvenRecovery2:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveHeal(10);
                    }
                }
                break;
            case PassiveC.EvenRecovery3:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveHeal(20);
                    }
                }
                break;
            case Weapon.AnyaryuNoBreath:
                if (!skillOwner.isWeaponRefined) {
                    if (this.globalBattleContext.currentTurn === 4) {
                        let count = 0;
                        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                            unit.reserveTakeDamage(10);
                            ++count;
                        }
                        skillOwner.reserveHeal(count * 5);
                    }
                } else {
                    let currentTurn = this.globalBattleContext.currentTurn;
                    if (3 <= currentTurn && currentTurn <= 4) {
                        let count = 0;
                        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 4)) {
                            unit.reserveTakeDamage(13);
                            count++;
                        }
                        skillOwner.reserveHeal(count * 13);
                    }
                }
                break;
            case PassiveB.Recovering:
                skillOwner.reserveHeal(10);
                break;
            case Weapon.FalchionRefined:
            case Weapon.FalcionEchoes:
            case Weapon.FalchionAwakening:
            case Weapon.KiriNoBreath:
            case PassiveB.Renewal1:
                if ((this.globalBattleContext.currentTurn + 1) % 4 === 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case PassiveB.Renewal2:
                if ((this.globalBattleContext.currentTurn + 1) % 3 === 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case PassiveB.Renewal3:
                if ((this.globalBattleContext.currentTurn + 1) % 2 === 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case Weapon.TamagoNoTsuePlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, true)) {
                    unit.reserveHeal(7);
                }
                break;
            case Weapon.ShirasagiNoTsubasa:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                    unit.reserveHeal(7);
                }
                break;
            case Weapon.AidPlus:
            case Weapon.StaffOfTwelvePlus:
            case PassiveC.SeimeiNoKagayaki:
            case PassiveC.SparklingBoostPlus: {
                let targetUnits = [];
                let maxDamage = 0;
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                    let damage = this.__getStatusEvalUnit(unit).currentDamage;
                    if (damage > maxDamage) {
                        maxDamage = damage;
                        targetUnits = [unit];
                    } else if (damage === maxDamage) {
                        targetUnits.push(unit);
                    }
                }
                for (let unit of targetUnits) {
                    let amount = skillId === PassiveC.SparklingBoostPlus ? 20 : 10;
                    unit.reserveHeal(amount);
                }
            }
                break;
            case PassiveB.SDrink:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reserveHeal(99);
                }
                break;
            case Weapon.MuninNoMaran:
                if (skillOwner.isWeaponSpecialRefined) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveHeal(7);
                    }
                }
                break;
        }
    }

    applyDamageSkillForBeginningOfTurn(skillId, skillOwner) {
        switch (skillId) {
            case Weapon.Mafu:
                if (this.globalBattleContext.currentTurn === 3) {
                    let units = this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, skillOwner.enemyGroupId, 5, 99);
                    for (let unit of units) {
                        if (isWeaponTypeTome(unit.weaponType)) {
                            continue;
                        }
                        unit.reserveTakeDamage(5);
                    }
                }
                break;
            case Weapon.Scadi: {
                let damageAmount = skillOwner.isWeaponRefined ? 7 : 10;
                let turnCond = skillOwner.isWeaponRefined ?
                    this.globalBattleContext.currentTurn === 2 || this.globalBattleContext.currentTurn === 3 :
                    this.globalBattleContext.currentTurn === 3;
                if (turnCond) {
                    let groupId = UnitGroupType.Enemy;
                    if (skillOwner.groupId === UnitGroupType.Enemy) {
                        groupId = UnitGroupType.Ally;
                    }
                    let units = this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, groupId, 3, 99);
                    for (let unit of units) {
                        unit.reserveTakeDamage(damageAmount);
                    }
                }
                break;
            }
            case PassiveC.UpheavalPlus:
                if (this.globalBattleContext.currentTurn === 1) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        unit.reserveTakeDamage(10);
                    }
                }
                break;
            case PassiveC.Upheaval:
            case PassiveC.WoefulUpheaval:
                if (this.globalBattleContext.currentTurn === 1) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        unit.reserveTakeDamage(7);
                    }
                }
                break;
            case Weapon.Sinmara:
                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    unit.reserveTakeDamage(20);
                }
                break;
        }
    }

    __applyDebuffForHighestStatus(unit, amount) {
        for (let status of this.__getStatusEvalUnit(unit).getHighestStatuses()) {
            switch (status) {
                case StatusType.Atk: unit.reserveToApplyAtkDebuff(amount); break;
                case StatusType.Spd: unit.reserveToApplySpdDebuff(amount); break;
                case StatusType.Def: unit.reserveToApplyDefDebuff(amount); break;
                case StatusType.Res: unit.reserveToApplyResDebuff(amount); break;
            }
        }
    }
    __applyPolySkill(skillOwnerUnit, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit)) {
            if (this.__isInCross(skillOwnerUnit, unit)
                && this.__getStatusEvalUnit(unit).getEvalResInPrecombat() < this.__getStatusEvalUnit(skillOwnerUnit).getEvalResInPrecombat()
            ) {
                debuffFunc(unit);
            }
        }
    }

    __applyOathSkill(skillOwnerUnit, buffFunc) {
        if (this.__isNextToOtherUnits(skillOwnerUnit)) {
            buffFunc(skillOwnerUnit);
        }
    }

    __applyOath4Skill(skillOwnerUnit, buffFunc) {
        if (this.__isThereAllyIn2Spaces(skillOwnerUnit)) {
            buffFunc(skillOwnerUnit);
            skillOwnerUnit.reserveToAddStatusEffect(StatusEffectType.AirOrders);
        }
    }

    __applyOpeningSkill(skillOwnerUnit, getValueFunc, buffFunc) {
        let maxUnits = [];
        let maxVal = 0;
        for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwnerUnit)) {
            let val = getValueFunc(unit);
            if (val > maxVal) {
                maxVal = val;
                maxUnits = [unit];
            }
            else if (val == maxVal) {
                maxUnits.push(unit);
            }
        }

        for (let unit of maxUnits) {
            buffFunc(unit);
        }
    }

    __applyThreatenSkill(skillOwnerUnit, applyDebuffFunc, conditionFunc = null) {
        for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwnerUnit, 2)) {
            if (conditionFunc != null && !conditionFunc(unit)) {
                continue;
            }
            applyDebuffFunc(unit);
        }
    }
    __applyHoneSkill(skillOwnerUnit, isApplicableFunc, applyBuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1, false)) {
            if (isApplicableFunc(unit)) {
                applyBuffFunc(unit);
            }
        }
    }
    __applyWaveSkill(skillOwnerUnit, divisionTwoRemainder, applyBuffFunc) {
        if ((this.globalBattleContext.currentTurn % 2) === divisionTwoRemainder) {
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1, true)) {
                applyBuffFunc(unit);
            }
        }
    }

    __applyTacticSkill(skillOwnerUnit, applyBuffFunc) {
        let unitsMap = this.#groupByUnits(
            this.enumerateUnitsInTheSameGroupOnMap(skillOwnerUnit, true),
            unit => unit.moveType
        );
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 2)) {
            let moveType = unit.moveType;
            if (unitsMap.has(moveType) &&
                unitsMap.get(moveType).length >= 3) {
                continue;
            }
            applyBuffFunc(unit);
        }
    }

    /**
     * ユニットをグループに分ける
     * @template T
     * @param {Unit[] | Generator<Unit>} units
     * @param {(unit: Unit) => T} keyFunc
     * @returns {Map<T, Unit[]>}
     */
    #groupByUnits(units, keyFunc) {
        let unitsMap = new Map();
        for (let unit of units) {
            let key = keyFunc(unit);
            if (unitsMap.has(key)) {
                unitsMap.get(key).push(unit);
            } else {
                unitsMap.set(key, [unit]);
            }
        }
        return unitsMap;
    }

    __isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit) {
        let sameMoveTypeCount = 1;
        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit)) {
            if (otherUnit.moveType === unit.moveType) {
                ++sameMoveTypeCount;
            }
        }
        return sameMoveTypeCount <= 2;
    }

    __applyHyosyoNoBreath(skillOwner) {
        for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
            unit.reserveToApplyAllDebuff(-4);
        }
    }
    __applyPlusTie(skillOwner) {
        let targets = [];
        let minHp = 100;
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
            if (!this.__getStatusEvalUnit(unit).isSpecialCharged) {
                continue;
            }

            let hp = this.__getStatusEvalUnit(unit).hp;
            if (hp < this.__getStatusEvalUnit(skillOwner).hp) {
                if (hp < minHp) {
                    minHp = hp;
                    targets = [unit];
                }
                else if (hp == minHp) {
                    targets.push(unit);
                }
            }
        }
        for (let unit of targets) {
            unit.reserveToIncreaseSpecialCount(2);
        }
    }

    __applySabotageSkillImpl(skillOwnerUnit, condFunc, debuffFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwnerUnit)) {
            if (!this.__isNextToOtherUnits(unit)) { continue; }
            if (!condFunc(unit)) { continue; }
            debuffFunc(unit);
        }
    }
    __applySabotageSkill(skillOwnerUnit, debuffFunc, diff = 3) {
        let condFunc = unit => {
            let unitRes = this.__getStatusEvalUnit(unit).getEvalResInPrecombat();
            let skillOwnerRes = this.__getStatusEvalUnit(skillOwnerUnit).getEvalResInPrecombat();
            return unitRes <= skillOwnerRes - diff;
        };
        this.__applySabotageSkillImpl(skillOwnerUnit, condFunc, debuffFunc);
    }

    __applyDebuffToMaxStatusUnits(unitGroup, getStatusFunc, applyDebuffFunc) {
        for (let unit of this.__findMaxStatusUnits(unitGroup, getStatusFunc)) {
            applyDebuffFunc(unit);
        }
    }

    /**
     * @returns {Unit[]}
     */
    __findMaxStatusUnits(unitGroup, getStatusFunc, exceptUnit = null) {
        return this._unitManager.findMaxStatusUnits(unitGroup, getStatusFunc, x => x == exceptUnit);
    }
    __findMinStatusUnits(unitGroup, getStatusFunc) {
        return this._unitManager.findMinStatusUnits(unitGroup, getStatusFunc);
    }

    /**
     * @return {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(targetUnit, spaces, withTargetUnit);
    }

    /**
     * @param {Unit} targetUnit
     * @param {number} spaces
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces) {
        return this._unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(targetUnit, spaces);
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit = false) {
        return this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
    }

    /**
     * @returns {Generator<Unit>}
     */
    enumerateUnitsInDifferentGroupOnMap(unit) {
        return this._unitManager.enumerateUnitsInDifferentGroupOnMap(unit);
    }

    enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength) {
        return this._unitManager.enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength);
    }

    __getPartnersInSpecifiedRange(targetUnit, spaces) {
        return Array.from(this._unitManager.enumeratePartnersInSpecifiedRange(targetUnit, spaces));
    }

    __applySkillToEnemiesInCross(skillOwner, conditionFunc, applySkillFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
            if (this.__isInCross(unit, skillOwner)) {
                if (conditionFunc(unit)) {
                    applySkillFunc(unit);
                }
            }
        }
    }

    __applyMenace(skillOwner, buffFunc, debuffFunc) {
        let found = false;
        for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
            found = true;
            debuffFunc(unit);
        }

        if (found) {
            buffFunc(skillOwner);
        }
    }
    __countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.countAlliesWithinSpecifiedSpaces(targetUnit, spaces, predicator);
    }
    __findNearestEnemies(targetUnit, distLimit = 100) {
        return this._unitManager.findNearestEnemies(targetUnit, distLimit);
    }

    __findNearestAllies(targetUnit, distLimit = 100) {
        return this._unitManager.findNearestAllies(targetUnit, distLimit);
    }
    __isInCross(unitA, unitB) {
        return unitB.isInCrossOf(unitA);
    }

    __isThereAllyIn2Spaces(targetUnit) {
        return this.__isThereAllyInSpecifiedSpaces(targetUnit, 2);
    }

    __isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator = null) {
        return this._unitManager.isThereAllyInSpecifiedSpaces(targetUnit, spaces, predicator);
    }

    __isNextToOtherUnits(unit) {
        for (let otherUnit of this._unitManager.enumerateUnitsInTheSameGroupOnMap(unit, false)) {
            if (!unit.isNextTo(otherUnit)) { continue; }
            return true;
        }
        return false;
    }

    __isSolo(unit) {
        for (let ally of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, 1)) {
            return false;
        }

        return true;
    }
    __isNextToOtherUnitsExceptDragonAndBeast(unit) {
        return this._unitManager.isNextToOtherUnitsExceptDragonAndBeast(unit);
    }
    __isNextToOtherUnitsExcept(unit, exceptCondition) {
        return this._unitManager.isNextToAlliesExcept(unit, exceptCondition);
    }

    /**
     * @param {Unit} unit
     * @returns {Unit}
     */
    __getStatusEvalUnit(unit) {
        return unit.snapshot != null ? unit.snapshot : unit;
    }
    __isThereAnyAllyUnit(unit, conditionFunc) {
        return this._unitManager.isThereAnyUnitInTheSameGroupOnMap(unit, conditionFunc);
    }
}
