
class BeginningOfTurnSkillHandler {
    /**
     * @param  {UnitManager} unitManager
     * @param  {BattleMap} map
     * @param  {GlobalBattleContext} globalBattleContext
     * @param  {LoggerBase} logger
     * @param  {Function} moveStructureToTrashBox
     */
    constructor(unitManager, map, globalBattleContext, logger, moveStructureToTrashBox) {
        this._unitManager = unitManager;
        this.map = map;
        this.globalBattleContext = globalBattleContext;
        this._logger = logger;
        this.moveStructureToTrashBox = moveStructureToTrashBox;
    }
    get isOddTurn() {
        return this.globalBattleContext.isOddTurn;
    }
    get isEvenTurn() {
        return this.globalBattleContext.isEvenTurn;
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

    /**
     * @param  {Unit} unit
     */
    applySkillsForBeginningOfTurn(unit) {
        for (let skillId of unit.enumerateSkills()) {
            this.applySkillForBeginningOfTurn(skillId, unit);
        }
    }

    applyReservedStateForAllUnitsOnMap(leavesOneHp) {
        for (let unit of this._unitManager.enumerateAllUnitsOnMap()) {
            if (unit.isDead) {
                continue;
            }

            this.applyReservedState(unit, leavesOneHp);
        }
    }

    applyReservedState(unit, leavesOneHp = true) {
        unit.applyReservedDebuffs();
        unit.applyReservedStatusEffects();
        unit.applyReservedHp(leavesOneHp);
    }

    /**
     * @param  {Number} skillId
     * @param  {Unit} skillOwner
     */
    applySkillForBeginningOfTurn(skillId, skillOwner) {
        if (isWeaponTypeBeast(skillOwner.weaponType) && skillOwner.hasWeapon) {
            if (!this.__isNextToOtherUnitsExceptDragonAndBeast(skillOwner)) {
                skillOwner.isTransformed = true;
                if (skillOwner.moveType === MoveType.Flying && isWeaponTypeBeast(skillOwner.weaponType)) {
                    skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
                }
            } else {
                skillOwner.isTransformed = false;
            }
        }

        switch (skillId) {
            case Weapon.HonorableBlade:
                skillOwner.reserveToAddStatusEffect(StatusEffectType.MobilityIncreased);
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
            case Weapon.DriftingGracePlus:
            case Weapon.LuminousGracePlus:
                skillOwner.reserveHeal(10);
                break;
            case Weapon.RauarLionPlus:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 1, false)) {
                    unit.applyAtkBuff(6);
                }
                break;
            case Weapon.PunishmentStaff:
                if (!skillOwner.isWeaponSpecialRefined) break;
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveToAddStatusEffect(StatusEffectType.CancelAffinity);
                        unit.applyAtkBuff(6);
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
                    skillOwner.applyDefBuff(6);
                }
                break;
            case Weapon.TridentPlus:
                if (this.__isThereAllyInSpecifiedSpaces(skillOwner, 3)) {
                    skillOwner.applyAtkBuff(6);
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
                    skillOwner.applyAllBuff(6);
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, false)) {
                        unit.applyAtkBuff(6);
                    }
                }
                break;
            case PassiveC.AtkSpdMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(6);
                        unit.applySpdBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    });
                break;
            case PassiveC.AtkResMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(6);
                        unit.applyResBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    });
                break;
            case PassiveC.AtkDefMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(6);
                        unit.applyDefBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplyDefDebuff(-6);
                    });
                break;
            case PassiveC.DefResMenace:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyDefBuff(6);
                        unit.applyResBuff(6);
                    },
                    unit => {
                        unit.reserveToApplyDefDebuff(-6);
                        unit.reserveToApplyResDebuff(-6);
                    });
                break;
            case PassiveC.SurtrsPortent:
                this.__applyMenace(skillOwner,
                    unit => {
                        unit.applyAtkBuff(5);
                        unit.applySpdBuff(5);
                        unit.applyDefBuff(5);
                        unit.applyResBuff(5);
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
                        skillOwner.applyAtkBuff(5);
                        skillOwner.applySpdBuff(5);
                        skillOwner.applyResBuff(5);
                    }
                }
                break;
            case Weapon.Shamsir:
                if (skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                        this.writeDebugLog(skillOwner.getNameWithGroup() + "はシャムシールを発動");
                        skillOwner.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.StaffOfRausten:
                for (let unit of this.__findNearestEnemies(skillOwner, 5)) {
                    unit.reserveToApplyResDebuff(-6);
                    unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                }
                break;
            case Weapon.TomeOfReglay:
                for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                    if (unit.isTome) {
                        unit.reduceSpecialCount(1);
                    }
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
                    skillOwner.reduceSpecialCount(2);
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
            case Weapon.KiaStaff: {
                let candidates = Array.from(this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 4, false));
                let negativeStatusCandidates = candidates.filter(unit => unit.hasNegativeStatusEffect());
                let targets = (negativeStatusCandidates.length === 0 ? candidates : negativeStatusCandidates)
                    .reduce((a, c) => {
                        if (a.length === 0) return [c];
                        let accumHp = this.__getStatusEvalUnit(a[0]).hp;
                        let currentHp = this.__getStatusEvalUnit(c).hp;
                        if (accumHp === currentHp) {
                            a.push(c);
                        } else if (currentHp < accumHp) {
                            a = [c];
                        }
                        return a;
                    }, []);
                for (let target of targets) {
                    target.applyAtkBuff(6);
                    target.applySpdBuff(6);
                    target.reserveToResetDebuffs();

                    // キアの杖の効果が重なると2回目の実行で対象が変化してしまうので予約する
                    // todo: 他の場所も状態が変化するものはすべて予約にしないといけない
                    target.reserveToClearNegativeStatusEffects();
                }
                break;
            }
            case Weapon.StudiedForblaze:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case Weapon.Hrist:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage === 100 && this.__isThereAllyInSpecifiedSpaces(skillOwner, 2)) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        unit.reserveTakeDamage(1);
                    }
                }
                break;
            case PassiveC.OddRecovery1:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(5);
                    }
                }
                break;
            case PassiveC.OddRecovery2:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(10);
                    }
                }
                break;
            case PassiveC.OddRecovery3:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(20);
                    }
                }
                break;
            case PassiveC.EvenRecovery1:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(5);
                    }
                }
                break;
            case PassiveC.EvenRecovery2:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(10);
                    }
                }
                break;
            case PassiveC.EvenRecovery3:
                if (!this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                        unit.reserveToResetDebuffs();
                        unit.reserveToClearNegativeStatusEffects();
                        unit.reserveHeal(20);
                    }
                }
                break;
            case Special.SeidrShell:
                if (this.globalBattleContext.currentTurn === 1) {
                    skillOwner.reduceSpecialCount(3);
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
                    unit => this.__getStatusEvalUnit(unit).getDefInPrecombat() < this.__getStatusEvalUnit(skillOwner).getDefInPrecombat(),
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Isolation));
                break;
            case Weapon.Gjallarbru:
                this.__applySkillToEnemiesInCross(skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp <= this.__getStatusEvalUnit(skillOwner).hp - 3,
                    unit => unit.reserveToAddStatusEffect(StatusEffectType.Isolation));
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
            case Weapon.Sekku:
                for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                    skillOwner.posX, skillOwner.posY, skillOwner.enemyGroupId, 1, 99)
                ) {
                    if (unit.isRangedWeaponType()
                        && this.__getStatusEvalUnit(skillOwner).hp >= this.__getStatusEvalUnit(unit).hp + 3
                    ) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Gravity);
                    }
                }
                break;
            case Weapon.AnyaryuNoBreath:
                if (this.globalBattleContext.currentTurn == 4) {
                    let count = 0;
                    for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 3)) {
                        unit.reserveTakeDamage(10);
                        ++count;
                    }
                    skillOwner.reserveHeal(count * 5);
                }
                break;
            case Weapon.Mafu:
                if (this.globalBattleContext.currentTurn == 3) {
                    for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, skillOwner.enemyGroupId, 5, 99)
                    ) {
                        if (isWeaponTypeTome(unit.weaponType)) {
                            continue;
                        }
                        unit.reserveToAddStatusEffect(StatusEffectType.CounterattacksDisrupted);
                        unit.reserveTakeDamage(5);
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
            case Weapon.Hyoushintou:
                for (let unit of this.__findNearestEnemies(skillOwner, 4)) {
                    unit.reserveToApplyAllDebuff(-4);
                }
                break;
            case Weapon.JinroMusumeNoTsumekiba:
                if (this.globalBattleContext.currentTurn == 1) {
                    skillOwner.reduceSpecialCount(2);
                    for (let unit of this.__getPartnersInSpecifiedRange(skillOwner, 100)) {
                        unit.reduceSpecialCount(2);
                    }
                }
                break;
            case Weapon.GroomsWings:
                if (this.globalBattleContext.currentTurn == 1) {
                    for (let unit of this.__getPartnersInSpecifiedRange(skillOwner, 100)) {
                        unit.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.Merikuru:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                        if (isPhysicalWeaponType(unit.weaponType)) {
                            unit.applyAllBuff(4);
                        }
                    }
                }
                break;
            case Weapon.HyosyoNoBreath:
                this.__applyHyosyoNoBreath(skillOwner);
                break;
            case PassiveB.KodoNoHukanGusu3:
                if (this.globalBattleContext.currentTurn % 2 == 0) {
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
                            skillOwner.reduceSpecialCount(1);
                        }
                    }
                }
                break;
            case Weapon.Toron:
            case Weapon.KyoufuArmars:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                    if (isNormalAttackSpecial(skillOwner.special)) {
                        skillOwner.reduceSpecialCount(1);
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
                    if (skillOwner.groupId == UnitGroupType.Enemy) {
                        groupId = UnitGroupType.Ally;
                    }
                    for (let unit of this.enumerateUnitsWithinSpecifiedRange(
                        skillOwner.posX, skillOwner.posY, groupId, 3, 99)
                    ) {
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                        unit.reserveTakeDamage(damageAmount);
                    }
                }
                break;
            }
            case Weapon.Forukuvangu:
                if (!skillOwner.isWeaponSpecialRefined) {
                    if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 50) {
                        skillOwner.applyAtkBuff(5);
                    }
                }
                break;
            case Weapon.MagoNoTePlus:
                if (this.globalBattleContext.currentTurn == 1) {
                    for (let unit of this.__findMaxStatusUnits(skillOwner.groupId, x => this.__getStatusEvalUnit(x).getAtkInPrecombat(), skillOwner)) {
                        unit.reduceSpecialCount(1);
                    }
                }
                break;
            case Weapon.NorenPlus:
            case Weapon.KinchakubukuroPlus:
                if (this.globalBattleContext.currentTurn == 1) {
                    skillOwner.reduceSpecialCount(2);
                }
                break;
            case PassiveB.TateNoKodo3:
                if (this.globalBattleContext.currentTurn == 1) {
                    if (isDefenseSpecial(skillOwner.special)) {
                        skillOwner.reduceSpecialCount(2);
                    }
                }
                break;
            case PassiveB.Ikari3:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage <= 75) {
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case PassiveB.ToketsuNoHuin:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.__findMinStatusUnits(
                        skillOwner.groupId == UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
                        x => this.__getStatusEvalUnit(x).getResInPrecombat())
                    ) {
                        unit.reserveToApplyAtkDebuff(-6);
                        unit.reserveToApplySpdDebuff(-6);
                    }
                }
                break;
            case PassiveB.KoriNoHuin:
                if (this.__getStatusEvalUnit(skillOwner).hpPercentage >= 50) {
                    for (let unit of this.__findMinStatusUnits(
                        skillOwner.groupId == UnitGroupType.Ally ? UnitGroupType.Enemy : UnitGroupType.Ally,
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
            case PassiveC.VisionOfArcadia:
                if (this.__isThereAnyAllyUnit(skillOwner, x => isWeaponTypeBreathOrBeast(x.weaponType))) {
                    for (let unit of this.__findMaxStatusUnits(
                        skillOwner.groupId,
                        x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                        skillOwner)
                    ) {
                        unit.applyAtkBuff(6);
                        unit.applyDefBuff(6);
                    }
                }
                break;
            case Weapon.ArdentDurandal:
                for (let unit of this.__findMaxStatusUnits(
                    skillOwner.groupId,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    skillOwner)
                ) {
                    unit.reserveToAddStatusEffect(StatusEffectType.BonusDoubler);
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
                if ((this.globalBattleContext.currentTurn + 1) % 4 == 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case PassiveB.Renewal2:
                if ((this.globalBattleContext.currentTurn + 1) % 3 == 0) {
                    skillOwner.reserveHeal(10);
                }
                break;
            case PassiveB.Renewal3:
                if ((this.globalBattleContext.currentTurn + 1) % 2 == 0) {
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
            case Weapon.StaffOfTwelvePlus:
            case PassiveC.SeimeiNoKagayaki:
                {
                    let targetUnits = [];
                    let maxDamage = 0;
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                        let damage = this.__getStatusEvalUnit(unit).currentDamage;
                        if (damage > maxDamage) {
                            maxDamage = damage;
                            targetUnits = [unit];
                        }
                        else if (damage == maxDamage) {
                            targetUnits.push(unit);
                        }
                    }
                    for (let unit of targetUnits) {
                        unit.reserveHeal(10);
                    }
                }
                break;
            case Weapon.DemonicTome:
            case PassiveC.HajimariNoKodo3:
                if (this.__getStatusEvalUnit(skillOwner).isSpecialCountMax) {
                    this.writeDebugLog(`${skillOwner.getNameWithGroup()}は始まりの鼓動(skillId: ${skillId})を発動`);
                    skillOwner.reduceSpecialCount(1);
                }
                break;
            case PassiveC.OstiasPulse2:
                for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, true)) {
                    if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                        unit.reduceSpecialCount(1);
                        unit.applyDefBuff(6);
                        unit.applyResBuff(6);
                    }
                }
                break;
            case PassiveC.OstiasPulse:
                if (this.globalBattleContext.currentTurn == 1) {
                    for (let unit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                        if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                            unit.reduceSpecialCount(1);
                        }
                    }
                }
                break;
            case Weapon.RantanNoTsuePlus:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat(),
                    x => { x.applyResBuff(5); x.applyDefBuff(5); });
                break;
            case Weapon.YujoNoHanaNoTsuePlus:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applyDefBuff(5); });
                break;
            case PassiveC.AtkOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getAtkInPrecombat(), x => x.applyAtkBuff(6));
                break;
            case PassiveC.SpdOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getSpdInPrecombat(), x => x.applySpdBuff(6));
                break;
            case PassiveC.DefOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getDefInPrecombat(), x => x.applyDefBuff(6));
                break;
            case PassiveC.ResOpening3:
                this.__applyOpeningSkill(skillOwner, x => this.__getStatusEvalUnit(x).getResInPrecombat(), x => x.applyResBuff(6));
                break;
            case PassiveC.SpdDefGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat() + this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => { x.applySpdBuff(5); x.applyDefBuff(5); }
                );
                break;
            case PassiveC.SpdResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getSpdInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.applySpdBuff(5); x.applyResBuff(5); }
                );
                break;
            case PassiveC.AtkResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applyResBuff(5); }
                );
                break;
            case PassiveC.AtkDefGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getDefInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applyDefBuff(5); }
                );
                break;
            case PassiveC.DefResGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getDefInPrecombat() + this.__getStatusEvalUnit(x).getResInPrecombat(),
                    x => { x.applyDefBuff(5); x.applyResBuff(5); }
                );
                break;
            case PassiveC.AtkSpdGap3:
                this.__applyOpeningSkill(skillOwner,
                    x => this.__getStatusEvalUnit(x).getAtkInPrecombat() + this.__getStatusEvalUnit(x).getSpdInPrecombat(),
                    x => { x.applyAtkBuff(5); x.applySpdBuff(5); }
                );
                break;
            case PassiveC.SpdDefOath3: this.__applyOathSkill(skillOwner, x => { x.applyDefBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.SpdResOath3: this.__applyOathSkill(skillOwner, x => { x.applyResBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.AtkSpdOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applySpdBuff(5); }); break;
            case PassiveC.AtkDefOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applyDefBuff(5); }); break;
            case PassiveC.AtkResOath3: this.__applyOathSkill(skillOwner, x => { x.applyAtkBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.DefResOath3: this.__applyOathSkill(skillOwner, x => { x.applyDefBuff(5); x.applyResBuff(5); }); break;
            case PassiveC.Upheaval:
                if (this.globalBattleContext.currentTurn == 1) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        unit.reserveTakeDamage(7);
                    }
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
                for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(skillOwner, false)) {
                    if (!otherUnit.isOnMap) { continue; }
                    if (skillOwner.isNextTo(otherUnit)) {
                        otherUnit.reserveToAddStatusEffect(StatusEffectType.EffectiveAgainstDragons);
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
            case Weapon.Sinmara:
                for (let unit of this.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(skillOwner, 2)) {
                    unit.reserveTakeDamage(20);
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
            case Weapon.AkaNoKen:
            case Weapon.DarkExcalibur:
                if (skillOwner.weaponRefinement == WeaponRefinementType.Special) {
                    if (this.globalBattleContext.currentTurn == 1) { skillOwner.reduceSpecialCount(2); }
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
                    skillOwner.reduceSpecialCount(reduceCount);
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
                            unit.reduceSpecialCount(1);
                        }
                    }
                }
                break;
            case PassiveB.SDrink:
                if (this.globalBattleContext.currentTurn == 1) {
                    skillOwner.reduceSpecialCount(1);
                    skillOwner.reserveHeal(99);
                }
                break;
            case PassiveS.OgiNoKodou:
                if (this.globalBattleContext.currentTurn == 1) {
                    this.writeDebugLog(skillOwner.getNameWithGroup() + "の奥義の鼓動により奥義発動カウント-1");
                    skillOwner.reduceSpecialCount(1);
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
            case Weapon.IagosTome:
                if (this.isOddTurn) {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (this.__isNextToOtherUnits(unit)) { continue; }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3))) { continue; }
                        unit.reserveToApplyAtkDebuff(-4);
                        unit.reserveToApplySpdDebuff(-4);
                        unit.reserveToAddStatusEffect(StatusEffectType.Guard);
                    }
                }
                else {
                    for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
                        if (!this.__isNextToOtherUnits(unit)) { continue; }
                        if (!(this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3))) { continue; }
                        unit.reserveToApplyDefDebuff(-4);
                        unit.reserveToApplyResDebuff(-4);
                        unit.reserveToAddStatusEffect(StatusEffectType.Panic);
                    }
                }
                break;
            case Weapon.AversasNight:
                this.__applySabotageSkillImpl(
                    skillOwner,
                    unit => this.__getStatusEvalUnit(unit).hp <= (this.__getStatusEvalUnit(skillOwner).hp - 3),
                    unit => { unit.reserveToApplyAllDebuff(-3); unit.reserveToAddStatusEffect(StatusEffectType.Panic); });
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
            case PassiveC.ThreatenAtkSpd3:
                this.__applyThreatenSkill(skillOwner,
                    x => {
                        skillOwner.applyAtkBuff(5); skillOwner.applySpdBuff(5);
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
                        skillOwner.applyAtkBuff(5); skillOwner.applyDefBuff(5);
                        x.reserveToApplyAtkDebuff(-5); x.reserveToApplyDefDebuff(-5);
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
                this.__applyWaveSkill(skillOwner, 1, x => { x.applyAllBuff(4); });
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
            case PassiveC.HoneArmor: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Armor, x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneCavalry: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Cavalry, x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneFlyier: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Flying, x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneDragons: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBreath(x.weaponType), x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.HoneBeasts: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBeast(x.weaponType), x => { x.applyAtkBuff(6); x.applySpdBuff(6); }); break;
            case PassiveC.FortifyArmor: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Armor, x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyCavalry: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Cavalry, x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyFlyier: this.__applyHoneSkill(skillOwner, x => x.moveType == MoveType.Flying, x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyDragons: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBreath(x.weaponType), x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
            case PassiveC.FortifyBeasts: this.__applyHoneSkill(skillOwner, x => isWeaponTypeBeast(x.weaponType), x => { x.applyDefBuff(6); x.applyResBuff(6); }); break;
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
                    if (skillOwner.isWeaponSpecialRefined) {
                        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwner, 2, true)) {
                            unit.reserveHeal(7);
                        }
                    }
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
                    if (unit.moveType == MoveType.Armor) {
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
            if (this.__isInCloss(skillOwnerUnit, unit)
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
        if ((this.globalBattleContext.currentTurn % 2) == divisionTwoRemainder) {
            for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 1, true)) {
                applyBuffFunc(unit);
            }
        }
    }
    __applyTacticSkill(skillOwnerUnit, applyBuffFunc) {
        for (let unit of this.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(skillOwnerUnit, 2)) {
            if (this.__isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit)) {
                applyBuffFunc(unit);
            }
        }
    }

    __isMoveTypeCountOnTeamIsLessThanOrEqualTo2(unit) {
        let sameMoveTypeCount = 1;
        for (let otherUnit of this.enumerateUnitsInTheSameGroupOnMap(unit)) {
            if (otherUnit.moveType == unit.moveType) { ++sameMoveTypeCount; }
        }
        if (sameMoveTypeCount <= 2) { return true; }
        return false;
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
            unit.increaseSpecialCount(2);
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
        this.__applySabotageSkillImpl(
            skillOwnerUnit,
            unit => this.__getStatusEvalUnit(unit).getEvalResInPrecombat() <= (this.__getStatusEvalUnit(skillOwnerUnit).getEvalResInPrecombat() - diff),
            debuffFunc);
    }

    __applyDebuffToMaxStatusUnits(unitGroup, getStatusFunc, applyDebuffFunc) {
        for (let unit of this.__findMaxStatusUnits(unitGroup, getStatusFunc)) {
            applyDebuffFunc(unit);
        }
    }
    __findMaxStatusUnits(unitGroup, getStatusFunc, exceptUnit = null) {
        return this._unitManager.findMaxStatusUnits(unitGroup, getStatusFunc, x => x == exceptUnit);
    }
    __findMinStatusUnits(unitGroup, getStatusFunc) {
        return this._unitManager.findMinStatusUnits(unitGroup, getStatusFunc);
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

    enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength) {
        return this._unitManager.enumerateUnitsWithinSpecifiedRange(posX, posY, unitGroup, rangeHorLength, rangeVerLength);
    }

    __getPartnersInSpecifiedRange(targetUnit, spaces) {
        return Array.from(this._unitManager.enumeratePartnersInSpecifiedRange(targetUnit, spaces));
    }

    __applySkillToEnemiesInCross(skillOwner, conditionFunc, applySkillFunc) {
        for (let unit of this.enumerateUnitsInDifferentGroupOnMap(skillOwner)) {
            if (this.__isInCloss(unit, skillOwner)) {
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
    __isInCloss(unitA, unitB) {
        return unitB.isInClossOf(unitA);
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
    __getStatusEvalUnit(unit) {
        return unit.snapshot != null ? unit.snapshot : unit;
    }
    __isThereAnyAllyUnit(unit, conditionFunc) {
        return this._unitManager.isThereAnyUnitInTheSameGroupOnMap(unit, conditionFunc);
    }
}
