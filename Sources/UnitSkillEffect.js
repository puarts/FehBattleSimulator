import { NeutralizingEndActionEnv, NodeEnv, PreventingStatusEffectEnv } from './SkillEffectEnv.js';
import { AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS, AFTER_BEING_GRANTED_ANOTHER_ACTION_ON_ASSIST_HOOKS, AFTER_CANTO_HOOKS, AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS, AT_COMPARING_STATS_HOOKS, CALCULATES_DISTANCE_OF_CANTO_HOOKS, CALCULATES_DISTANCE_OF_CANTO_WHEN_CANTO_CONTROL_IS_APPLIED_HOOKS, CALC_HEAL_AMOUNT_HOOKS, CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS, CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS, CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_FOE_HOOKS, CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS, CAN_ACTIVATE_STYLE_HOOKS, CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS, CAN_ATTACK_FOES_N_SPACES_AWAY_HOOKS, CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS, CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS, CAN_NEUTRALIZE_STATUS_EFFECTS_HOOKS, GET_COLOR_WHEN_DETERMINING_WEAPON_TRIANGLE_HOOKS, HAS_PATHFINDER_HOOKS, IS_AFFLICTOR_HOOKS, IS_DEBUFFER_TIER_1_HOOKS, IS_DEBUFFER_TIER_2_HOOKS, STYLE_ACTIVATED_HOOKS, UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS, WHEN_CANTO_TRIGGERS_HOOKS } from './SkillEffectHooks.js';
import { CantoEnv, getSkillLogLevel } from './SkillEffect.js';
import { LoggerBase } from './Logger.js';
import { CAN_MOVE_THROUGH_FOES_SPACE_SKILLS, applyEndActionSkillsFuncMap, applySkillsAfterCantoActivatedFuncMap, calcHealAmountFuncMap, calcMoveCountForCantoFuncMap, canActivateObstructToAdjacentTilesFuncMap, getColorFromWeaponType, getSkillFunc, hasPathfinderEffect, isAfflictorFuncMap, isMeleeWeaponType, isRangedWeaponType, isWeaponTypeTome } from './Skill.js';
import { StatusEffectType } from './StatusConstants.js';
import { PassiveA, PassiveB, PassiveC, PassiveS, STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN, STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0, Support, Weapon, WeaponRefinementType } from './SkillConstants.js';
import { MoveType } from './HeroInfoConstants.js';
import { g_appData } from './AppDataGlobal.js';

/**
 * Unit.prototype にスキル効果関連メソッドを追加する初期化関数。
 * エントリーポイントから明示的に呼び出す必要がある。
 * @param {typeof import("./UnitCore.js").Unit} UnitClass
 */
export function initUnitSkillEffects(UnitClass) {

    /**
     * 再移動が発動可能なら発動します。
     */
    UnitClass.prototype.activateCantoIfPossible = function(moveCountForCanto, cantoControlledIfCantoActivated) {
        if (!this.isActionDone || this.isCantoActivatedInCurrentTurn) {
            return;
        }

        this.moveCountForCanto = moveCountForCanto;

        if (this.isCantoActivated()) {
            this.isActionDone = false;
            this.isCantoActivatedInCurrentTurn = true;
            let env = new CantoEnv(this);
            env.setName('再移動開始時').setLogLevel(getSkillLogLevel());
            WHEN_CANTO_TRIGGERS_HOOKS.evaluateWithUnit(this, env);
            if (cantoControlledIfCantoActivated) {
                this.addStatusEffect(StatusEffectType.CantoControl);
                this.moveCountForCanto = this.calcMoveCountForCanto();
                if (this.isRangedWeaponType() &&
                    this.moveCountForCanto === 0) {
                    this.endAction();
                    this.applyEndActionSkills(true);
                    this.deactivateCanto();
                }
            }
            // 再移動発動直後スキル
            for (let skillId of this.enumerateSkills()) {
                let func = getSkillFunc(skillId, applySkillsAfterCantoActivatedFuncMap);
                func?.call(this, moveCountForCanto, cantoControlledIfCantoActivated);
            }
            // 同時タイミングに付与された天脈を消滅させる
            g_appData?.map?.applyReservedDivineVein();
        }
    };

    /**
     * @param {number} statusEffectType
     */
    UnitClass.prototype.addStatusEffect = function(statusEffectType) {
        let units = g_appData?.enumerateAllUnitsOnMap?.() ?? [];
        for (let unit of units) {
            let env = new PreventingStatusEffectEnv(unit, this, statusEffectType);
            env.setName('ステータス付与時').setLogLevel(getSkillLogLevel());
            if (CAN_NEUTRALIZE_STATUS_EFFECTS_HOOKS.evaluateSomeWithUnit(unit, env)) {
                return;
            }
        }
        if (this.hasStatusEffect(statusEffectType)) {
            return;
        }
        this._addStatusEffectRaw(statusEffectType);
    };

    /// すり抜けを発動可能ならtrue、そうでなければfalseを返します。
    UnitClass.prototype.canActivatePass = function() {
        let env = new NodeEnv().setUnitManager(g_appData).setTarget(this).setSkillOwner(this);
        // TODO: ログの出し方を考える
        // env.setName('すり抜け').setLogLevel(getSkillLogLevel());
        env.setName('すり抜け');
        if (UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS.evaluateSomeWithUnit(this, env)) {
            return true;
        }
        for (let skillId of this.enumerateSkills()) {
            if (CAN_MOVE_THROUGH_FOES_SPACE_SKILLS.has(skillId)) {
                return true;
            }
        }
        return (this.passiveB === PassiveB.Surinuke3 && this.hpPercentage >= 25)
            || (this.weapon === Weapon.FujinYumi && !this.isWeaponRefined && this.hpPercentage >= 50);
    };

    /**
     * 隣接マスの敵に進軍阻止を発動できるならtrue、そうでなければfalseを返します。
     */
    UnitClass.prototype.canActivateObstructToAdjacentTiles = function(moveUnit) {
        let canObstruct = false;
        let env = new NodeEnv().setSkillOwner(this).setTarget(moveUnit);
        // env.setName('移動時(1マス以内)').setLogLevel(getSkillLogLevel());
        env.setName('移動時(1マス以内)').setLogLevel(LoggerBase.LogLevel.WARN);
        canObstruct |= CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS.evaluateSomeWithUnit(this, env);
        for (let skillId of this.enumerateSkills()) {
            let func = getSkillFunc(skillId, canActivateObstructToAdjacentTilesFuncMap);
            if (func?.call(this, moveUnit) ?? false) {
                canObstruct = true;
                break;
            }
        }
        canObstruct |=
            this.passiveB === PassiveB.ShingunSoshi3 && this.hpPercentage >= 50 ||
            this.passiveS === PassiveB.ShingunSoshi3 && this.hpPercentage >= 50 ||
            this.weapon === Weapon.CaptainsSword ||
            this.passiveB === PassiveB.DetailedReport ||
            this.passiveB === PassiveB.AtkSpdBulwark3 ||
            this.passiveB === PassiveB.AtkDefBulwark3 ||
            this.passiveB === PassiveB.SpdDefBulwark3 ||
            this.passiveB === PassiveB.SpdResBulwark3;
        return canObstruct || (this.passiveS === PassiveS.GoeiNoGuzo && moveUnit.isRangedWeaponType());
    };

    /**
     * 2マス以内の敵に進軍阻止を発動できるならtrue、そうでなければfalseを返します。
     */
    UnitClass.prototype.canActivateObstructToTilesWithin2Spaces = function(moveUnit) {
        let canObstruct = false;
        let env = new NodeEnv().setSkillOwner(this).setTarget(moveUnit);
        // env.setName('移動時(2マス以内)').setLogLevel(getSkillLogLevel());
        env.setName('移動時(2マス以内)').setLogLevel(LoggerBase.LogLevel.WARN);
        canObstruct |= CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS.evaluateSomeWithUnit(this, env);

        canObstruct |= (
            this.weapon === Weapon.CaptainsSword ||
            this.passiveB === PassiveB.AtkSpdBulwark3 ||
            this.passiveB === PassiveB.AtkDefBulwark3 ||
            this.passiveB === PassiveB.SpdDefBulwark3 ||
            this.passiveB === PassiveB.SpdResBulwark3 ||
            this.passiveB === PassiveB.DetailedReport
        ) && moveUnit.isRangedWeaponType();
        return canObstruct;
    };

    UnitClass.prototype.cannotMoveThroughSpacesWithin2SpacesOfUnit = function(enemy) {
        let env = new NodeEnv().setSkillOwner(this).setTarget(this).setTargetFoe(enemy);
        // env.setName('自分が移動時(2マス以内)').setLogLevel(getSkillLogLevel());
        env.setName('自分が移動時(2マス以内)').setLogLevel(LoggerBase.LogLevel.WARN);
        return CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_FOE_HOOKS.evaluateSomeWithUnit(this, env);
    };

    UnitClass.prototype.cannotMoveThroughSpacesWithin3SpacesOfUnit = function(enemy) {
        let env = new NodeEnv().setSkillOwner(this).setTarget(this).setTargetFoe(enemy);
        // env.setName('自分が移動時(3マス以内)').setLogLevel(getSkillLogLevel());
        env.setName('自分が移動時(3マス以内)').setLogLevel(LoggerBase.LogLevel.WARN);
        return CANNOT_UNIT_MOVE_THROUGH_SPACES_WITHIN_3_SPACES_OF_FOE_HOOKS.evaluateSomeWithUnit(this, env);
    };

    UnitClass.prototype.endActionBySkillEffect = function() {
        let units = g_appData?.enumerateAllUnitsOnMap?.() ?? [];
        for (let unit of units) {
            let env = new NeutralizingEndActionEnv(unit, this);
            env.setName('スキルによる行動終了時').setLogLevel(getSkillLogLevel());
            if (CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS.evaluateSomeWithUnit(unit, env)) {
                return;
            }
        }
        this.endAction();
    };

    UnitClass.prototype.endActionByStatusEffect = function() {
        let units = g_appData?.enumerateAllUnitsOnMap?.() ?? [];
        for (let unit of units) {
            let env = new NeutralizingEndActionEnv(unit, this);
            env.setName('ステータスによる行動終了時').setLogLevel(getSkillLogLevel());
            if (CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS.evaluateSomeWithUnit(unit, env)) {
                return;
            }
        }
        this.endAction();
    };

    UnitClass.prototype.applyEndActionSkills = function(isCantoEndAction = false) {
        // ユニットが死んだ場合は発動しないはず
        // TODO: 今後死後に発動する効果を持つスキルが実装されたら修正する
        if (this.isDead) {
            return;
        }

        // ここでは天脈の予約を行う
        // 同時タイミングに異なる複数の天脈が付与されていなければ天脈付与を確定させる
        // After unit acts (if Canto triggers, after Canto)
        for (let skillId of this.enumerateSkills()) {
            getSkillFunc(skillId, applyEndActionSkillsFuncMap)?.call(this);
        }

        let env = new NodeEnv().setTarget(this).setSkillOwner(this).setUnitManager(g_appData)
            .setBattleMap(g_appData.map).setIsCantoEndAction(isCantoEndAction)
            .setTextUnit(this);
        env.setName('行動後or再移動後').setLogLevel(getSkillLogLevel());
        AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.evaluateWithUnit(this, env);
        if (isCantoEndAction) {
            AFTER_CANTO_HOOKS.evaluateWithUnit(this, env)
        }
        for (let unit of g_appData?.enumerateAllUnitsOnMap() ?? []) {
            unit.applyReservedState(false);
        }
    };

    UnitClass.prototype.getColorWhenDeterminingWeaponTriangle = function() {
        let env = new NodeEnv().setTarget(this).setSkillOwner(this)
            .setName('3すくみ決定時の色').setLogLevel(LoggerBase.LogLevel.OFF);
        let color = GET_COLOR_WHEN_DETERMINING_WEAPON_TRIANGLE_HOOKS.evaluateOneNumberWithUnit(this, env);
        if (color && color >= 0) {
            return color;
        }
        return getColorFromWeaponType(this.weaponType);
    };

    Object.defineProperty(UnitClass.prototype, 'attackRangeOnMap', {
        get: function() {
        if (this.isStyleActive) {
            let env = new NodeEnv().setTarget(this).setSkillOwner(this)
                .setName('スタイル時の射程').setLogLevel(LoggerBase.LogLevel.OFF);
            let range = CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS.evaluateMaxWithUnit(this, env);
            if (range > 0) return range;
        }
        if (this.attackRange > 0) {
            let env = new NodeEnv().setTarget(this).setSkillOwner(this)
                .setName('射程').setLogLevel(LoggerBase.LogLevel.OFF);
            let range = CAN_ATTACK_FOES_N_SPACES_AWAY_HOOKS.evaluateMaxWithUnit(this, env);
            if (range > 0) return range;
        }
        return this.attackRange;
        },
        configurable: true,
    });

    UnitClass.prototype.__getEvalStatsAdd = function() {
        let env = new NodeEnv().setTarget(this).setSkillOwner(this).setName('ステータス比較時')
            .setLogLevel(getSkillLogLevel());
        return AT_COMPARING_STATS_HOOKS.evaluateStatsSumWithUnit(this, env);
    };

    /**
     * 実際に攻撃可能なユニットとタイルを列挙します。
     * スタイル変更時も含みます。
     * TODO: スタイル変更フラグを渡せるようにする
     */
    UnitClass.prototype.enumerateActuallyAttackableUnitAndTiles = function*() {
        for (let unit of this.enumerateAttackableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist === this.attackRange) {
                    yield [unit, tile];
                }
            }
        }

        /// スタイル時
        // 攻撃可能なユニットから攻撃可能なユニットとタイルの組み合わせを作成する
        if (this.hasCannotMoveStyle()) {
            // リンスタイル
            for (let unit of this.enumerateAttackableUnitsInStyle()) {
                yield [unit, this.placedTile];
            }
        } else if (this.hasAvailableStyle()) {
            // その他のスタイル
            for (let unit of this.enumerateAttackableUnitsInAttackChangingStyle()) {
                for (let tile of this.enumerateMovableTiles(false)) {
                    let env = new NodeEnv().setTarget(unit).setSkillOwner(unit)
                        .setName('実際に攻撃可能な対象決定時').setLogLevel(LoggerBase.LogLevel.OFF);
                    let range = CAN_ATTACK_FOES_N_SPACES_AWAY_DURING_STYLE_HOOKS.evaluateMaxWithUnit(unit, env);
                    if (range > 0) {
                        let dist = tile.calculateDistanceToUnit(unit);
                        if (dist === range) {
                            yield [unit, tile];
                        }
                    }
                }
            }
        }
    };

    /// 天駆の道の効果を持つか
    UnitClass.prototype.hasPathfinderEffect = function() {
        if (this.hasStatusEffect(StatusEffectType.Pathfinder) &&
            !this.hasStatusEffect(StatusEffectType.Schism)) {
            return true;
        }
        for (let skillId of this.enumerateSkills()) {
            if (hasPathfinderEffect(skillId)) {
                return true;
            }
        }
        let env = new NodeEnv().setTarget(this).setSkillOwner(this)
            .setName('天駆の道判定').setLogLevel(LoggerBase.LogLevel.OFF);
        return HAS_PATHFINDER_HOOKS.evaluateSomeWithUnit(this, env);
    };

    /**
     * 再移動の移動数を計算します。
     */
    UnitClass.prototype.calcMoveCountForCanto = function() {
        let moveCountForCanto = 0;
        if (this.hasStatusEffect(StatusEffectType.CantoControl)) {
            moveCountForCanto = isMeleeWeaponType(this.weaponType) ? 1 : 0;
            let env = new CantoEnv(this);
            env.setName('再移動距離計算時（制限時）').setLogLevel(getSkillLogLevel());
            moveCountForCanto = Math.max(moveCountForCanto,
                CALCULATES_DISTANCE_OF_CANTO_WHEN_CANTO_CONTROL_IS_APPLIED_HOOKS.evaluateMaxWithUnit(this, env));
            return moveCountForCanto;
        }
        if (this.hasStatusEffect(StatusEffectType.Canto1)) {
            moveCountForCanto = Math.max(moveCountForCanto, 1);
        }
        let env = new CantoEnv(this);
        env.setName('再移動距離計算時').setLogLevel(getSkillLogLevel());
        moveCountForCanto = Math.max(moveCountForCanto, CALCULATES_DISTANCE_OF_CANTO_HOOKS.evaluateMaxWithUnit(this, env));
        for (let skillId of this.enumerateSkills()) {
            let moveCount = getSkillFunc(skillId, calcMoveCountForCantoFuncMap)?.call(this, moveCountForCanto) ?? 0;
            moveCountForCanto = Math.max(moveCountForCanto, moveCount);
            // 同系統効果複数時、最大値適用
            switch (skillId) {
                // 再移動(1)
                case Weapon.VezuruNoYoran:
                    if (this.isWeaponSpecialRefined) {
                        moveCountForCanto = Math.max(moveCountForCanto, 1);
                    }
                    break;
                case Weapon.Queenslance:
                    if (this.hasPositiveStatusEffect()) {
                        moveCountForCanto = Math.max(moveCountForCanto, 1);
                    }
                    break;
                case PassiveB.DeepStar:
                case Weapon.TeatimeSetPlus:
                case Weapon.BakedTreats:
                case Weapon.FujinRaijinYumi:
                case PassiveB.SoaringWings:
                case PassiveB.FirestormDance3:
                case PassiveB.EscapeRoute4:
                case Weapon.FloridKnifePlus:
                case Weapon.BowOfTwelve:
                case PassiveB.MoonlitBangleF:
                    moveCountForCanto = Math.max(moveCountForCanto, 1);
                    break;
                // 再移動(2)
                case Weapon.PaydayPouch: // 再移動2
                    if (this.getPositiveStatusEffects().length >= 3) {
                        moveCountForCanto = Math.max(moveCountForCanto, 2);
                    }
                    break;
                case Weapon.AbsoluteAmiti:
                case PassiveC.FettersOfDromi:
                case PassiveB.LunarBrace2:
                case Weapon.NidavellirSprig:
                case Weapon.NidavellirLots:
                case PassiveB.SolarBrace2:
                case PassiveB.MoonlightBangle:
                case Weapon.DolphinDiveAxe:
                case Weapon.FlowerLance:
                case Weapon.BlazingPolearms:
                    moveCountForCanto = Math.max(moveCountForCanto, 2);
                    break;
                // 残り+1
                case Weapon.NightmareHorn:
                    if (this.isWeaponRefined) {
                        moveCountForCanto = Math.max(moveCountForCanto, this.restMoveCount + 1);
                    }
                    break;
                case Weapon.OkamijoouNoKiba:
                    if (this.isTransformed) {
                        moveCountForCanto = Math.max(moveCountForCanto, this.restMoveCount + 1);
                    }
                    break;
                case Weapon.ReginRave:
                    if (this.isWeaponSpecialRefined) {
                        if (this.hasPositiveStatusEffect()) {
                            moveCountForCanto = Math.max(moveCountForCanto, this.restMoveCount + 1);
                        }
                    }
                    break;
                case Weapon.SurfersSpire:
                case Weapon.SurfersSpade:
                case PassiveA.KnightlyDevotion:
                case PassiveB.FlowNTrace3:
                case PassiveB.BeastNTrace3:
                case Weapon.FloridCanePlus:
                case Weapon.TriEdgeLance:
                case PassiveB.Chivalry:
                case Weapon.UnyieldingOar:
                case Weapon.JollyJadeLance:
                case PassiveB.HodrsZeal:
                case PassiveB.MurderousLion:
                case PassiveB.AtkSpdNearTrace3:
                case PassiveB.AtkDefNearTrace3:
                case PassiveB.AtkResNearTrace3:
                case PassiveB.SpdDefNearTrace3:
                case PassiveB.SpdResNearTrace3:
                    moveCountForCanto = Math.max(moveCountForCanto, this.restMoveCount + 1);
                    break;
                // 残り
                case PassiveB.DazzleFarTrace:
                case Weapon.FrozenDelight:
                case PassiveB.AtkSpdFarTrace3:
                case PassiveB.AtkDefFarTrace3:
                case PassiveB.AtkResFarTrace3:
                case PassiveB.SpdDefFarTrace3:
                case PassiveB.SpdResFarTrace3:
                    moveCountForCanto = Math.max(moveCountForCanto, this.restMoveCount);
                    break;
                // マス間の距離、最大3
                case Weapon.BrightwindFans: {
                    let dist = Unit.calcMoveDistance(this)
                    moveCountForCanto = Math.max(moveCountForCanto, Math.min(dist, 3));
                }
                    break;
                // マス間の距離+1、最大4
                case Weapon.TeatimesEdge: {
                    let dist = Unit.calcMoveDistance(this)
                    moveCountForCanto = Math.max(moveCountForCanto, Math.min(dist + 1, 4));
                }
                    break;
            }
        }
        return moveCountForCanto;
    };

    UnitClass.prototype.grantsAnotherActionAfterCombat = function() {
        if (this.isActionDone) {
            let env = new NodeEnv().setTarget(this).setAssistTargeting(this).setSkillOwner(this)
                .setUnitManager(g_appData)
                .setName('再行動後（戦闘後）').setLogLevel(getSkillLogLevel());
            AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS.evaluateWithUnit(this, env);
        }
        this.isActionDone = false;
    };

    UnitClass.prototype.grantsAnotherActionAfterCombatExceptOwnSkills = function(skillOwner) {
        if (!this.isActionDone) {
            return false;
        }
        let oncePerTurnSkills = skillOwner.activatedOncePerTurnSkillEffectIdsThisTurn;
        if (!oncePerTurnSkills.has(Unit.GRANTS_ANOTHER_ACTION_AFTER_COMBAT_EXCEPT_OWN_SKILLS_ID)) {
            let env = new NodeEnv().setTarget(this)
                .setUnitManager(g_appData)
                .setName('再行動後（戦闘後自分以外のスキル）').setLogLevel(getSkillLogLevel());
            AFTER_BEING_GRANTED_ANOTHER_ACTION_AFTER_COMBAT_HOOKS.evaluateWithUnit(this, env);
            this.reservedAnotherAction = true;
            oncePerTurnSkills.add(Unit.GRANTS_ANOTHER_ACTION_AFTER_COMBAT_EXCEPT_OWN_SKILLS_ID);
            return true;
        }
        return false;
    };

    UnitClass.prototype.grantsAnotherActionOnAssist = function(reserves = false) {
        if (this.isActionDone) {
            let env = new NodeEnv().setTarget(this).setAssistTargeting(this).setSkillOwner(this)
                .setName('再行動後').setLogLevel(getSkillLogLevel());
            AFTER_BEING_GRANTED_ANOTHER_ACTION_ON_ASSIST_HOOKS.evaluateWithUnit(this, env);
        }
        if (reserves) {
            this.reservedAnotherActionTypes.add(Unit.AnotherActionType.ON_ASSIST);
        } else {
            this.isActionDone = false;
        }
        this.activatedOncePerTurnSkillEffectIdsThisTurn.add(Unit.GRANTS_ANOTHER_ACTION_ON_ASSIST_ID);
        if (g_appData?.globalBattleContext) {
            g_appData.globalBattleContext.reservedIsAnotherActionByAssistActivatedInCurrentTurn[this.groupId] = true;
        }
    };

    UnitClass.prototype.deactivateStyleAfterAction = function() {
        // remaining movement granted from Canto is treated as 0.
        if (STYLES_THAT_REMAINING_MOVEMENT_FROM_CANTO_IS_TREATED_AS_0.has(this.getAvailableStyle())) {
            this.restMoveCount = 0;
        }
        this.deactivateStyle();
        this.isStyleActivatedInThisTurn = true;
        this.styleActivationsCount++;
        let env = new NodeEnv().setTarget(this).setSkillOwner(this);
        env.setName("行動でのスタイル発動後").setLogLevel(getSkillLogLevel());
        STYLE_ACTIVATED_HOOKS.evaluateWithUnit(this, env);
    };

    UnitClass.prototype.hasAvailableStyleButCannotActivate = function() {
        if (!this.hasAvailableStyle() || this.isStyleActive) {
            return false;
        }
        if (STYLES_THAT_CAN_BE_USED_ONLY_ONCE_PER_TURN.has(this.getAvailableStyle())) {
            if (this.styleActivationsCount > 0) {
                return true;
            }
        }
        if (this.restStyleSkillAvailableTurn > 0) {
            return true;
        }
        let env = new NodeEnv().setTarget(this).setSkillOwner(this);
        env.setName("スタイル発動可能判定").setLogLevel(LoggerBase.LogLevel.OFF);
        // env.setName("スタイル発動可能判定").setLogLevel(getSkillLogLevel());
        return !CAN_ACTIVATE_STYLE_HOOKS.evaluateSomeWithUnit(this, env);
    };
}

/**
 * @brief 回復補助の回復量を取得します。
 * @param {Unit} assistUnit 補助者のユニット
 * @param {Unit} targetUnit 補助対象のユニット
 * TODO: マジックシールドについて調査する
 */
function calcHealAmount(assistUnit, targetUnit) {
    let healAmount = 0;
    let skillId = assistUnit.support;
    healAmount += getSkillFunc(skillId, calcHealAmountFuncMap)?.call(this, assistUnit, targetUnit) ?? 0;

    let env = new NodeEnv().setAssistUnits(assistUnit, targetUnit);
    env.setName('補助での回復時').setLogLevel(getSkillLogLevel());
    healAmount += CALC_HEAL_AMOUNT_HOOKS.evaluateSumWithUnit(assistUnit, env);

    switch (skillId) {
        case Support.Heal:
            healAmount = 5;
            break;
        case Support.Reconcile:
            healAmount = 7;
            break;
        case Support.Physic:
            healAmount = 8;
            break;
        case Support.Mend:
            healAmount = 10;
            break;
        case Support.Recover:
            healAmount = 15;
            break;
        case Support.Martyr:
            healAmount = assistUnit.currentDamage + 7;
            break;
        case Support.MartyrPlus:
            healAmount = assistUnit.currentDamage + Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 7) {
                healAmount += 7;
            }
            break;
        case Support.Rehabilitate: {
            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
            if (targetUnit.hp <= halfHp) {
                healAmount += (halfHp - targetUnit.hp) * 2;
            }
            healAmount += 7;
        }
            break;
        case Support.RehabilitatePlus: {
            healAmount += Math.floor(assistUnit.getAtkInPrecombat() * 0.5) - 10;
            if (healAmount < 7) {
                healAmount = 7;
            }

            let halfHp = Math.floor(targetUnit.maxHpWithSkills * 0.5);
            if (targetUnit.hp <= halfHp) {
                healAmount += (halfHp - targetUnit.hp) * 2;
            }
            healAmount += 7;
        }
            break;
        case Support.PhysicPlus:
        case Support.RestorePlus:
        case Support.RescuePlus:
        case Support.ReturnPlus:
        case Support.NudgePlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5);
            if (healAmount < 8) {
                healAmount = 8;
            }
            break;
        case Support.Restore:
        case Support.Rescue:
        case Support.Return:
        case Support.Nudge:
            healAmount = 8;
            break;
        case Support.RecoverPlus:
            healAmount = Math.floor(assistUnit.getAtkInPrecombat() * 0.5) + 10;
            if (healAmount < 15) {
                healAmount = 15;
            }
            break;
    }
    if (targetUnit.currentDamage < healAmount) {
        return targetUnit.currentDamage;
    }
    return healAmount;
}

function isDebufferTier1(attackUnit, targetUnit) {
    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
        .setSkillOwner(attackUnit)
        .setName('Tier1のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
    if (IS_DEBUFFER_TIER_1_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
        return true;
    }
    return attackUnit.weapon === Weapon.Hlidskjalf;
}

/// Tier 2 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
function isDebufferTier2(attackUnit, targetUnit) {
    let env = new NodeEnv().setUnitsDuringCombat(attackUnit, targetUnit, true)
        .setSkillOwner(attackUnit)
        .setName('Tier2のデバッファー判定').setLogLevel(LoggerBase.LogLevel.OFF);
    if (IS_DEBUFFER_TIER_2_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
        return true;
    }
    for (let skillId of attackUnit.enumerateSkills()) {
        switch (skillId) {
            case Weapon.RogueDagger:
            case Weapon.RogueDaggerPlus:
                if (attackUnit.weaponRefinement === WeaponRefinementType.None) {
                    return true;
                }
                break;
            case Weapon.PoisonDagger:
            case Weapon.PoisonDaggerPlus:
                if (targetUnit.moveType === MoveType.Infantry) {
                    return true;
                }
                break;
            case Weapon.KittyPaddle:
            case Weapon.KittyPaddlePlus:
                if (isWeaponTypeTome(targetUnit.weapon)) {
                    return true;
                }
                break;
            case PassiveB.SealDef3:
            case PassiveB.SealRes3:
            case PassiveB.SealAtkDef2:
            case PassiveB.SealAtkRes2:
            case PassiveB.SealDefRes2:
            case PassiveB.SealSpdDef2:
                return true;
        }
    }
    return false;
}

/**
 * ユニットがアフリクターであるかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartH
 * @param  {Unit} attackUnit
 * @param  {boolean} lossesInCombat
 * @param result
 * @return {boolean}
 */
function isAfflictor(attackUnit, lossesInCombat, result) {
    // TODO: envにlossesInCombat, resultを取れるようにする
    let env = new NodeEnv().setTarget(attackUnit).setUnitsDuringCombat(attackUnit, null, true)
        .setSkillOwner(attackUnit)
        .setName('アフリクター判定').setLogLevel(LoggerBase.LogLevel.OFF);
    if (IS_AFFLICTOR_HOOKS.evaluateSomeWithUnit(attackUnit, env)) {
        return true;
    }
    for (let skillId of attackUnit.enumerateSkills()) {
        let func = getSkillFunc(skillId, isAfflictorFuncMap);
        if (func?.call(this, attackUnit, lossesInCombat, result) ?? false) {
            return true;
        }
        switch (skillId) {
            case Weapon.DuskDawnStaff:
                return true;
            case Weapon.TigerSpirit:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.FlamelickBreath:
            case Weapon.FrostbiteBreath:
                if (attackUnit.battleContext.restHpPercentage >= 25) {
                    return true;
                }
                break;
            case Weapon.Pain:
            case Weapon.PainPlus:
            case Weapon.Panic:
            case Weapon.PanicPlus:
            case Weapon.FlashPlus:
            case Weapon.Candlelight:
            case Weapon.CandlelightPlus:
            case Weapon.DotingStaff:
            case Weapon.MerankoryPlus:
            case Weapon.CandyStaff:
            case Weapon.CandyStaffPlus:
            case Weapon.LegionsAxe:
            case Weapon.LegionsAxePlus:
            case Weapon.SneeringAxe:
            case Weapon.DeathlyDagger:
            case Weapon.SnipersBow:
            case Weapon.DokuNoKen:
                return true;
            case Weapon.MonstrousBowPlus:
            case Weapon.GhostNoMadosyoPlus:
            case Weapon.Scadi:
            case Weapon.ObsessiveCurse:
                if (attackUnit.isWeaponRefined) {
                    return true;
                }
                break;
            case PassiveC.PanicSmoke3:
            case PassiveC.PanicSmoke4:
            case PassiveC.FatalSmoke3:
            case PassiveC.DefResSmoke3:
                return !lossesInCombat;
            case PassiveB.PoisonStrike3:
                return !lossesInCombat;
        }
    }
    return false;
}

export { calcHealAmount, isDebufferTier1, isDebufferTier2, isAfflictor };