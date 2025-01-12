/**
 * @file
 * @brief Unit クラスやそれに関連する関数や変数定義です。
 */

function isThief(unit) {
    return isThiefIndex(unit.heroIndex);
}

function calcArenaBaseStatusScore(baseStatusTotal) {
    return Math.floor(baseStatusTotal / 5);
}

function calcArenaTotalSpScore(totalSp) {
    return Math.floor(totalSp / 100);
}

/// 攻撃可能なユニット情報です。
class AttackableUnitInfo {
    /**
     * @param  {Unit} targetUnit
     */
    constructor(targetUnit) {
        /** @type {Unit} **/
        this.targetUnit = targetUnit;

        /** @type {Tile[]} **/
        this.tiles = [];

        /** @type {Tile} **/
        this.bestTileToAttack = null;
        this.damageRatios = [];

        /** @type {CombatResult[]} **/
        this.combatResults = [];

        /** @type {DamageCalcResult[]} **/
        this.combatResultDetails = [];

        /** @type {boolean} **/
        this.usesStyle = false;
    }

    toString() {
        let result = this.targetUnit.getNameWithGroup() + ": ";
        for (let tile of this.tiles) {
            result += "(" + tile.posX + "," + tile.posY + ")";
        }
        return result;
    }
}

/// 攻撃の優先度評価に使用するコンテキストです。
class AttackEvaluationContext {
    constructor() {
        this.damageRatio = 0;
        this.combatResult = CombatResult.Draw;
        this.isDebufferTier1 = false;
        this.isDebufferTier2 = false;
        this.isAfflictor = false;
        this.isSpecialChargeIncreased = false;
        this.movementRange = 0;

        this.attackPriority = 0;
        this.attackTargetPriorty = 0;
    }

    calcAttackTargetPriority(attackTarget) {
        let specialChargeIncreasedPriority = 0;
        if (this.isSpecialChargeIncreased) {
            specialChargeIncreasedPriority = 1;
        }

        let debufferTier1Priority = 0;
        if (this.isDebufferTier1) {
            debufferTier1Priority = 1;
        }
        let debufferTier2Priority = 0;
        if (this.isDebufferTier2) {
            debufferTier2Priority = 1;
        }

        this.attackTargetPriorty =
            this.combatResult * 1000000 +
            debufferTier1Priority * 500000 +
            debufferTier2Priority * 250000 +
            this.damageRatio * 100 +
            specialChargeIncreasedPriority * 10 +
            attackTarget.slotOrder;
    }

    calcAttackPriority(attacker) {
        let specialChargeIncreasedPriority = 0;
        if (this.isSpecialChargeIncreased) {
            specialChargeIncreasedPriority = 1;
        }
        let debuffPriority1 = 0;
        let debuffPriority2 = 0;
        if (this.isDebufferTier1) {
            debuffPriority1 = 1;
        } else if (this.isDebufferTier2) {
            debuffPriority2 = 1;
        }
        let afflictorPriority = 0;
        if (this.isAfflictor) {
            afflictorPriority = 1;
        }
        this.movementRange = attacker.moveCount;

        this.attackPriority =
            this.combatResult * 1000000 +
            debuffPriority1 * 500000 +
            debuffPriority2 * 250000 +
            afflictorPriority * 100000 +
            this.damageRatio * 100 +
            this.movementRange * 20 +
            specialChargeIncreasedPriority * 10 +
            attacker.slotOrder;
    }
}

/// 補助行動の優先度を計算するためのクラスです。
class AssistableUnitInfo {
    constructor(targetUnit) {
        this.targetUnit = targetUnit;
        this.assistableTiles = [];

        // noinspection JSUnusedGlobalSymbols
        this.hasThreatenedByEnemyStatus = targetUnit.actionContext.hasThreatenedByEnemyStatus;
        this.hasThreatensEnemyStatus = targetUnit.actionContext.hasThreatensEnemyStatus;
        this.amountOfStatsActuallyBuffed = 0;
        this.amountHealed = 0;
        this.distanceFromClosestEnemy = targetUnit.distanceFromClosestEnemy;
        this.visibleStatTotal = targetUnit.getVisibleStatusTotal();
        this.slotOrder = targetUnit.slotOrder;
        this.isTeleportationRequired = false;
        this.requiredMovementCount = 0;
        this.numOfOtherEligibleTargetsBuffed = 0;
        this.isIntendedAndLowestSlot = false;

        this.assistTargetPriority = 0;
        this.rallyUpTargetPriority = 0;

        this.bestTileToAssist = null;
        this.hasStatAndNonStatDebuff = 0;
    }

    calcAssistTargetPriority(assistUnit, isPrecombat = true, isCantoAssist = false) {
        let assistType;
        if (isCantoAssist) {
            assistType = assistUnit.cantoAssistType;
        } else {
            assistType = assistUnit.supportInfo.assistType;
            // TODO: 検証する。とりあえずHPが減っていた場合は回復スキルとして扱う
            let skillId = assistUnit.support;
            if (isRallyHealSkill(skillId)) {
                assistType = this.targetUnit.isFullHp ? AssistType.Rally : AssistType.Heal;
            }
        }
        switch (assistType) {
            case AssistType.Refresh:
                this.assistTargetPriority = this.__calcRefreshTargetPriority();
                break;
            case AssistType.Heal:
                this.assistTargetPriority = this.__calcHealTargetPriority(assistUnit);
                break;
            case AssistType.Rally:
                this.assistTargetPriority = this.__calcRallyTargetPriority(assistUnit, isPrecombat);
                break;
            case AssistType.Move:
                this.assistTargetPriority = this.__calcMovementTargetPriority(assistUnit);
                break;
            case AssistType.Restore:
                this.assistTargetPriority = this.__calcRestoreTargetPriority(assistUnit);
                break;
        }
        if (!isCantoAssist) {
            let skillId = assistUnit.support;
            if (isRallyHealSkill(skillId)) {
                // 応援より回復優先
                if (assistType === AssistType.Heal) {
                    // TODO: 適切な数値に修正する
                    this.assistTargetPriority *= 10000000;
                }
            }
        }
    }

    __calcRestoreTargetPriority(assistUnit) {
        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
        let negativeEffectPriority = 0;
        let amountHealedPriority = 0;
        let visibleStatTotalPriority = 0;
        if (!this.targetUnit.hasNegativeStatusEffect()) {
            negativeEffectPriority = 1;
            amountHealedPriority = this.amountHealed;
            visibleStatTotalPriority = this.visibleStatTotal;
        }

        return negativeEffectPriority * 1000000
            + amountHealedPriority * 10000
            + visibleStatTotalPriority * 10
            + this.targetUnit.slotOrder;
    }

    __calcMovementTargetPriority(assistUnit) {
        this.requiredMovementCount = this.bestTileToAssist.calculateUnitMovementCountToThisTile(assistUnit);

        let assistedWithTeleportSkillPriority = 0;
        if (this.isTeleportationRequired) {
            assistedWithTeleportSkillPriority = 1;
        }

        // ワユ教授の資料だとpost combatだとこの条件になっているが、ステータス合計は評価されないっぽい？
        // return assistedWithTeleportSkillPriority * 1000000
        //     + this.visibleStatTotal * 500
        //     - this.requiredMovementCount * 10
        //     + this.slotOrder;

        return assistedWithTeleportSkillPriority * 1000000
            - this.requiredMovementCount * 10
            // todo: 隣接するブロックされた敵のスロット順がここに入る
            //       (Offensive Movement Assistのみで参照されるはずなので実装しなくてもそんなに実害ない)
            + this.slotOrder;
    }

    __calcHealTargetPriority(assistUnit) {
        this.amountHealed = calcHealAmount(assistUnit, this.targetUnit);
        return this.amountHealed * 1000000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }

    __calcRefreshTargetPriority() {
        let hasThreatensEnemyStatusPriority = 0;
        if (this.hasThreatensEnemyStatus) {
            hasThreatensEnemyStatusPriority = 1;
        }
        return hasThreatensEnemyStatusPriority * 1000000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }

    __calcRallyTargetPriority(assistUnit, isPrecombat) {
        this.hasStatAndNonStatDebuff = 0;
        if (assistUnit.support === Support.HarshCommandPlus) {
            // 一喝+は弱化と状態異常の両方が付与されてるユニットが最優先
            if (this.targetUnit.hasStatDebuff() && this.targetUnit.hasNonStatDebuff()) {
                this.hasStatAndNonStatDebuff = 1;
            }
        }

        this.amountOfStatsActuallyBuffed = 0;
        if (isPrecombat) {
            if (!isRallyUp(assistUnit.support)) {
                this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
            }
        } else {
            this.amountOfStatsActuallyBuffed = calcBuffAmount(assistUnit, this.targetUnit);
        }

        return this.hasStatAndNonStatDebuff * 1000000
            + this.amountOfStatsActuallyBuffed * 300000
            - this.distanceFromClosestEnemy * 3000
            + this.visibleStatTotal * 10
            + this.slotOrder;
    }
}

/// 敵の動き計算時のコンテキスト
class ActionContext {
    constructor() {
        // 補助のコンテキスト
        this.assistPriority = 0;
        /** @type {AssistableUnitInfo[]} */
        this.assistableUnitInfos = [];
        this.hasThreatenedByEnemyStatus = false;
        this.hasThreatensEnemyStatus = false;
        this.bestTileToAssist = null;
        this.bestTargetToAssist = null;
        this.isBlocker = false;

        // 攻撃者選択のコンテキスト

        /** @type {AttackableUnitInfo[]} */
        this.attackableUnitInfos = [];

        /** @type {Unit} */
        this.bestTargetToAttack = null;

        /** @type  {Object.<Unit, AttackEvaluationContext>} */
        this.attackEvalContexts = {}; // key=target unit, value=AttackEvaluationContext

        /** @type {Unit} */
        this.bestAttacker = null;

        // その他(オリジナルAI用)
        this.attackableTiles = [];

        // 移動のコンテキスト
        this.movePriority = 0;
        this.hasShuffleStatus = false;
    }

    clear() {
        this.assistPriority = 0;
        this.assistableUnitInfos = [];
        this.hasThreatensEnemyStatus = false;
        this.hasThreatenedByEnemyStatus = false;
        this.hasThreatensEnemyStatus = false;
        this.bestTileToAssist = null;
        this.bestTargetToAssist = null;
        this.isBlocker = false;

        this.attackableUnitInfos = [];
        this.bestTargetToAttack = null;
        this.attackEvalContexts = {};
        this.bestAttacker = null;
        this.attackableTiles = [];

        this.movePriority = 0;
        this.hasShuffleStatus = false;
    }

    findAssistableUnitInfo(unit) {
        for (let info of this.assistableUnitInfos) {
            if (info.targetUnit === unit) {
                return info;
            }
        }
        return null;
    }

    findAttackableUnitInfo(unit) {
        for (let info of this.attackableUnitInfos) {
            if (info.targetUnit === unit) {
                return info;
            }
        }
        return null;
    }

    removeAttackableUnitInfosWhereBestTileIsEmpty() {
        this.attackableUnitInfos = this.attackableUnitInfos.filter(
            function (item) {
                return item.bestTileToAttack != null;
            }
        );
    }
}

/**
 * TODO: リファクタリング
 * BattleContextについて範囲奥義で設定したコンテキストを戦闘開始時に消してしまうので両方で使用可能な値の扱いが非常に複雑になってしまっているので修正する
 */
class PrecombatContext {
    constructor() {
        this.initContext();
    }

    initContext() {
        this.damageCountOfSpecialAtTheSameTime = 0;
    }

    /**
     * @param {BattleContext} context
     */
    copyTo(context) {
        context.damageCountOfSpecialAtTheSameTime = this.damageCountOfSpecialAtTheSameTime;
    }
}

/// ユニットのインスタンス
class Unit extends BattleMapElement {
    #hpAddAfterEnteringBattle = 0;
    #statusEffects = [];
    constructor(id = "", name = "",
        unitGroupType = UnitGroupType.Ally, moveType = MoveType.Infantry) {
        super();
        // Unitはマップ上で作るので利便性のために初期値0にしておく
        this.setPos(0, 0);
        this._id = id;
        this._name = name;
        this._groupId = unitGroupType;
        this._moveType = moveType;
        this._hp = 1;
        this._maxHp = 1;
        this._atk = 50;
        this._spd = 40;
        this._def = 30;
        this._res = 30;

        this._placedTile = null;
        this._moveCount = 1;
        this.moveCountAtBeginningOfTurn = 1;

        /** @type {HeroInfo} */
        this.heroInfo = null;

        this.level = 40;
        this.rarity = UnitRarity.Star5;

        this.battleContext = new BattleContext();
        this.actionContext = new ActionContext();
        this.precombatContext = new PrecombatContext();

        /** @type {number} */
        this.slotOrder = 0;

        this.weaponRefinement = WeaponRefinementType.None;
        this.summonerLevel = SummonerLevel.None; // 絆レベル
        this.merge = 0; // 限界突破数
        this.dragonflower = 0; // 神竜の花
        this.emblemHeroMerge = 0; // 紋章士の限界突破
        this.reinforcementMerge = 0; // 増援ユニットに対する増援神階の凸数の最大値
        this.blessingEffects = [];
        this.blessing1 = BlessingType.None;
        this.blessing2 = BlessingType.None;
        this.blessing3 = BlessingType.None;
        this.blessing4 = BlessingType.None;
        this.blessing5 = BlessingType.None;
        this.blessing6 = BlessingType.None;
        this.grantedBlessing = SeasonType.None; // 付与された祝福
        this.providableBlessingSeason = SeasonType.None; // 付与できる祝福
        this.hpLv1 = 0;
        this.atkLv1 = 0;
        this.spdLv1 = 0;
        this.defLv1 = 0;
        this.resLv1 = 0;
        this.hpLvN = 0;
        this.atkLvN = 0;
        this.spdLvN = 0;
        this.defLvN = 0;
        this.resLvN = 0;
        this.hpIncrement = 0;
        this.hpDecrement = 0;
        this.atkIncrement = 0;
        this.atkDecrement = 0;
        this.spdIncrement = 0;
        this.spdDecrement = 0;
        this.defIncrement = 0;
        this.defDecrement = 0;
        this.resIncrement = 0;
        this.resDecrement = 0;

        /** @type {number} */
        this.ivHighStat = StatusType.None;

        /** @type {number} */
        this.ivLowStat = StatusType.None;

        /** @type {number} 開花得意の対象 */
        this.ascendedAsset = StatusType.None;

        this.restHp = 1; // ダメージ計算で使うHP
        this.reservedDamage = 0;
        this.reservedHeal = 0;
        this.reservedHealNeutralizesDeepWounds = 0;
        this.reservedStatusEffects = [];
        this.reservedStatusEffectSetToNeutralize = new Set();
        this.reservedStatusEffectCountInOrder = 0;
        this.reservedAtkBuff = 0;
        this.reservedSpdBuff = 0;
        this.reservedDefBuff = 0;
        this.reservedResBuff = 0;
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
        this.reservedSpecialCount = 0;
        /** @type {boolean[]} */
        this.reservedBuffFlagsToNeutralize = [false, false, false, false];
        /** @type {boolean[]} */
        this.reservedDebuffFlagsToNeutralize = [false, false, false, false];

        this.tmpSpecialCount = 0; // ダメージ計算で使う奥義カウント
        this.weaponType = WeaponType.None;
        this.specialCount = 0;
        this.maxSpecialCount = 0;

        this._maxHpWithSkills = 0;
        this.hpAdd = 0;
        this.hpMult = 1.0;
        this.#hpAddAfterEnteringBattle = 0;
        this._atkBuff = 0;
        this._atkDebuff = 0;
        this.atkSpur = 0;
        this.atkAdd = 0;
        this.atkMult = 1.0;
        this.atkWithSkills = 0;
        this._spdBuff = 0;
        this._spdDebuff = 0;
        this.spdSpur = 0;
        this.spdAdd = 0;
        this.spdMult = 1.0;
        this.spdWithSkills = 0;
        this._defBuff = 0;
        this._defDebuff = 0;
        this.defSpur = 0;
        this.defAdd = 0;
        this.defMult = 1.0;
        this.defWithSkills = 0;
        this._resBuff = 0;
        this._resDebuff = 0;
        this.resSpur = 0;
        this.resAdd = 0;
        this.resMult = 1.0;
        this.resWithSkills = 0;
        this.weapon = -1;
        this.support = -1;
        this.special = -1;
        this.passiveA = -1;
        this.passiveB = -1;
        this.passiveC = -1;
        this.passiveS = -1;
        this.passiveX = -1;
        this.captain = -1;

        /**
         * TODO: 初期局面に戻った場合に全てリセットする必要があるか検証する
         * 大器
         * @type {[number, number, number,number]}
         */
        this._greatTalents = [0, 0, 0, 0];
        this._reservedGreatTalents = [0, 0, 0, 0];
        this._reservedMaxGreatTalents = [0, 0, 0, 0];

        // TODO: 削除
        // noinspection JSUnusedGlobalSymbols
        this.deffensiveTile = false; // 防御床
        this.setMoveCountFromMoveType();

        this.hpGrowthRate = 0.0;
        this.atkGrowthRate = 0.0;
        this.spdGrowthRate = 0.0;
        this.resGrowthRate = 0.0;
        this.defGrowthRate = 0.0;

        // TODO: 何に使用しているのか調べる
        // noinspection JSUnusedGlobalSymbols
        this.hpAppliedGrowthRate = 0.0;
        // noinspection JSUnusedGlobalSymbols
        this.atkAppliedGrowthRate = 0.0;
        // noinspection JSUnusedGlobalSymbols
        this.spdAppliedGrowthRate = 0.0;
        // noinspection JSUnusedGlobalSymbols
        this.resAppliedGrowthRate = 0.0;
        // noinspection JSUnusedGlobalSymbols
        this.defAppliedGrowthRate = 0.0;

        this.isActionDone = false;
        // このターン自分から攻撃を行ったか
        this.isAttackDone = false;
        // このターン相手から攻撃を行われたか
        this.isAttackedDone = false;
        // このターン戦闘を行なったか
        this.isCombatDone = false;
        // このターン補助を行ったか
        this.isSupportDone = false;
        // このターン補助を行われたか
        this.isSupportedDone = false;

        this.isBonusChar = false;

        this.isAidesEssenceUsed = false;

        this.#statusEffects = [];
        // TODO: 何に使用しているか調べる
        // noinspection JSUnusedGlobalSymbols
        this.bonuses = [];

        this.perTurnStatuses = [];
        this.distanceFromClosestEnemy = -1;

        /** @type {SkillInfo} */
        this.weaponInfo = null;
        /** @type {SkillInfo} */
        this.supportInfo = null;
        /** @type {SkillInfo} */
        this.specialInfo = null;

        /** @type {SkillInfo} */
        this.passiveAInfo = null;
        /** @type {SkillInfo} */
        this.passiveBInfo = null;
        /** @type {SkillInfo} */
        this.passiveCInfo = null;
        /** @type {SkillInfo} */
        this.passiveSInfo = null;
        /** @type {SkillInfo} */
        this.passiveXInfo = null;
        /** @type {SkillInfo} */
        this.captainInfo = null;

        // indexが0の英雄が存在するので-1で初期化する
        this.partnerHeroIndex = -1;
        this.emblemHeroIndex = EmblemHero.None;
        this.partnerLevel = PartnerLevel.None; // 支援レベル

        this.isTransformed = false; // 化身
        this.isResplendent = false; // 神装化

        this.isEnemyActionTriggered = false; // 敵AIが行動開始したかどうか

        this.movementOrder = 0;

        // 双界で護衛が初期位置に戻るのに必要
        this.initPosX = 0;
        this.initPosY = 0;

        // 元の場所に再移動の際に使用
        // TODO: rename
        this.fromPosX = 0;
        this.fromPosY = 0;
        this._startTile = null;

        // 迅雷やノヴァの聖戦士が発動したかを記録しておく
        this.isOneTimeActionActivatedForWeapon = false;
        this.isOneTimeActionActivatedForWeapon2 = false;
        this.isOneTimeActionActivatedForSpecial = false;
        this.isOneTimeActionActivatedForSupport = false;
        this.isOneTimeActionActivatedForPassiveB = false;
        this.isOneTimeActionActivatedForShieldEffect = false;
        this.isOneTimeActionActivatedForFallenStar = false;
        this.isOneTimeActionActivatedForDeepStar = false;
        // 総選挙フェリクスの一匹狼
        // 戦闘後
        // 戦闘以外の行動後
        this.hasGrantedAnotherActionAfterCombatInitiation = false;
        this.hasGrantedAnotherActionAfterActionWithoutCombat = false;

        this.isOneTimeActionActivatedForWeaponPerGame = false;
        this.isOneTimeActionActivatedForWeaponPerGame2 = false;

        /**
         * @type {Set<string>}
         */
        this.oneTimeActionPerTurnActivatedSet = new Set();

        // 戦闘後、自分を行動可能な状態にし、再移動を発動済みなら発動可能にする
        //（同じタイミングで自分を行動可能な状態にする他の効果が発動した場合、この効果も発動したものとする）
        //（1ターンに1回のみ）
        this.isAnotherActionInPostCombatActivated = false;

        this.isOneTimeActionActivatedForCantoRefresh = false;

        // 奥義に含まれるマップに1回の効果が発動したかを記憶しておく
        this.hasOncePerMapSpecialActivated = false;

        // 比翼スキルを使用したか
        this.duoOrHarmonizedSkillActivationCount = 0;
        this.isDuoOrHarmonicSkillActivatedInThisTurn = false;

        // Unitの情報を記録しておく用
        /** @type {Unit} */
        this.snapshot = null;

        /** ダブル後衛ユニット
         *  @type {Unit}
         **/
        this.pairUpUnit = null;

        /** ダブル後衛ユニットを編集中かどうか
         *  @type {Boolean}
         **/
        this.isEditingPairUpUnit = false;

        /** 自身がダブル後衛ユニットかどうか
         *  @type {Boolean}
         **/
        this.isPairUpUnit = false;

        // TODO: 削除
        // noinspection JSUnusedGlobalSymbols
        this.blessingCount = 2;

        // 査定計算用
        this.arenaScore = 0;
        this.totalSp = 0;
        this.rating = 0;
        this.rarityScore = 0;
        this.levelScore = 0;
        this.weaponSp = 0;
        this.specialSp = 0;
        this.supportSp = 0;
        this.passiveASp = 0;
        this.passiveBSp = 0;
        this.passiveCSp = 0;
        this.passiveSSp = 0;
        // noinspection JSUnusedGlobalSymbols
        this.passiveXSp = 0;

        // 攻撃可能なタイル
        this.movableTiles = [];
        this.movableTilesIgnoringWarpBubble = [];
        this.attackableTiles = [];
        this.attackableTilesInCannotMoveStyle = [];
        this.assistableTiles = [];
        this.teleportOnlyTiles = [];
        this.precombatSpecialTiles = [];

        // シリアライズする時に一時的に使用
        this.ownerType = 0;
        this.heroIndex = 0;

        // select2でオプションが変わった時に値がリセットされるので一時保存しておく用
        this.reservedWeapon = NotReserved;
        this.reservedSupport = NotReserved;
        this.reservedSpecial = NotReserved;
        this.reservedPassiveA = NotReserved;
        this.reservedPassiveB = NotReserved;
        this.reservedPassiveC = NotReserved;
        this.reservedPassiveS = NotReserved;
        this.reservedPassiveX = NotReserved;

        this.chaseTargetTile = null;

        // Canto
        this.moveCountForCanto = 0; // 再移動の移動マス数
        this.isCantoActivatedInCurrentTurn = false; // 現在ターンで再移動が1度でも発動したかどうか
        this.isCantoActivating = false; // 再移動中かどうか
        this.cantoAssistType = AssistType.None;
        this.cantoAssistRange = 0;
        this.cantoSupport = CantoSupport.None;

        // ロキの盤上遊戯で一時的に限界突破を変える必要があるので、元の限界突破数を記録する用
        // noinspection JSUnusedGlobalSymbols
        this.originalMerge = 0;
        // noinspection JSUnusedGlobalSymbols
        this.originalDragonflower = 0;

        this.warFundsCost = 0; // ロキの盤上遊戯で購入に必要な軍資金

        this.originalTile = null; // 護り手のように一時的に移動する際に元の位置を記録しておく用

        this.restMoveCount = 0; // 再移動(残り)で参照する残り移動量

        this.restWeaponSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない
        this.restSupportSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない
        this.restSpecialSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない
        this.restPassiveBSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない
        this.restStyleSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない

        this.nameWithGroup = "";
        this.__updateNameWithGroup();

        // TODO: リファクタリングする
        this.isActionDoneDuringMoveCommand = false;

        this.canWarpForcibly = false;

        this.anotherActionTurnForCallingCircle = -1;

        this._isStyleActive = false;
        this.isStyleActivatedInThisTurn = false;
    }

    /**
     * ダブル後衛ユニットを設定可能かどうか
     * @returns {Boolean}
     */
    get canHavePairUpUnit() {
        return this.heroInfo != null && this.heroInfo.canHavePairUpUnit;
    }

    /**
     * @returns {Number}
     */
    getCaptainSkill() {
        return this.isCaptain ? this.captain : Captain.None;
    }

    /**
     * 隊長であればtrue、そうでなければfalseを返します。
     * @returns {boolean}
     */
    get isCaptain() {
        return this.slotOrder === 0;
    }

    get statusEvalUnit() {
        return this.snapshot !== null ? this.snapshot : this;
    }

    /**
     * @param  {number} statusType
     */
    isAsset(statusType) {
        return this.ivHighStat === statusType || (this.ascendedAsset === statusType && (this.merge > 0 || this.ivLowStat !== statusType));
    }

    /**
     * @param  {number} statusType
     */
    isFlaw(statusType) {
        return this.ivLowStat === statusType && this.merge === 0 && this.ascendedAsset !== statusType;
    }

    __updateNameWithGroup() {
        this.nameWithGroup = this.name + "(" + groupIdToString(this.groupId) + ")";
    }

    saveCurrentHpAndSpecialCount() {
        this.restHp = this.hp;
        this.battleContext.restHp = this.restHp;
        this.tmpSpecialCount = this.specialCount;
    }

    applyRestHpAndTemporarySpecialCount() {
        this.hp = this.restHp;
        this.specialCount = this.tmpSpecialCount;
    }

    saveOriginalTile() {
        this.originalTile = this.placedTile;
    }

    restoreOriginalTile() {
        this.originalTile.setUnit(this);
        this.originalTile = null;
    }

    distance(otherUnit) {
        return Math.abs(this.posX - otherUnit.posX) + Math.abs(this.posY - otherUnit.posY);
    }

    isPartner(ally) {
        return this.partnerHeroIndex === ally.heroIndex
            || ally.partnerHeroIndex === this.heroIndex;
    }

    canActivateCanto() {
        return this.isActionDone && !this.isCantoActivatedInCurrentTurn;
    }

    /**
     * 再移動が発動可能なら発動します。
     */
    activateCantoIfPossible(moveCountForCanto, cantoControlledIfCantoActivated) {
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
                if (this.isRangedWeaponType()) {
                    this.endAction();
                    this.applyEndActionSkills();
                    this.deactivateCanto();
                }
            }
            // 再移動発動直後スキル
            for (let skillId of this.enumerateSkills()) {
                let func = getSkillFunc(skillId, applySkillsAfterCantoActivatedFuncMap);
                func?.call(this, moveCountForCanto, cantoControlledIfCantoActivated);
            }
            // 同時タイミングに付与された天脈を消滅させる
            g_appData.map.applyReservedDivineVein();
        }
    }

    /**
     * 再移動の発動を終了します。
     */
    deactivateCanto() {
        this.moveCountForCanto = 0;
        this.isCantoActivating = false;
        this.clearCantoAssist();
    }

    /**
     * 再移動が発動しているとき、trueを返します。
     */
    isCantoActivated() {
        return this.isCantoActivating;
    }

    canActivateCantoAssist() {
        return this.cantoSupport !== CantoSupport.None;
    }

    clearCantoAssist() {
        this.cantoAssistType = AssistType.None;
        this.cantoAssistRange = 0;
        this.cantoSupport = CantoSupport.None;
    }

    trySetCantoAssist(assistType, assistRange, support) {
        // 異なる補助を設定しようとする場合再移動補助自体を無効にする
        if (this.cantoSupport !== CantoSupport.None &&
            this.cantoSupport !== support) {
            this.clearCantoAssist();
            return false;
        }
        this.cantoAssistType = assistType;
        this.cantoAssistRange = assistRange;
        this.cantoSupport = support;
        return true;
    }

    chaseTargetTileToString() {
        if (this.chaseTargetTile === null) {
            return "null";
        }
        return this.chaseTargetTile.positionToString();
    }

    __calcAppliedGrowthRate(growthRate) {
        return calcAppliedGrowthRate_Optimized(growthRate, this.rarity);
    }

    __calcGrowthValue(growthRate) {
        return calcGrowthValue(growthRate, this.rarity, this.level);
    }


    clearReservedSkills() {
        this.reservedWeapon = NotReserved;
        this.reservedSupport = NotReserved;
        this.reservedSpecial = NotReserved;
        this.reservedPassiveA = NotReserved;
        this.reservedPassiveB = NotReserved;
        this.reservedPassiveC = NotReserved;
        this.reservedPassiveS = NotReserved;
        this.reservedPassiveX = NotReserved;
    }

    reserveCurrentSkills() {
        this.reservedWeapon = this.weapon;
        this.reservedSupport = this.support;
        this.reservedSpecial = this.special;
        this.reservedPassiveA = this.passiveA;
        this.reservedPassiveB = this.passiveB;
        this.reservedPassiveC = this.passiveC;
        this.reservedPassiveS = this.passiveS;
        this.reservedPassiveX = this.passiveX;
    }

    restoreReservedSkills() {
        this.restoreReservedWeapon();
        this.restoreReservedSupport();
        this.restoreReservedSpecial();
        this.restoreReservedPassiveA();
        this.restoreReservedPassiveB();
        this.restoreReservedPassiveC();
        this.restoreReservedPassiveS();
        this.restoreReservedPassiveX();
    }

    hasReservedWeapon() {
        return this.reservedWeapon !== NotReserved;
    }

    restoreReservedWeapon() {
        if (this.reservedWeapon !== NotReserved) {
            this.weapon = this.reservedWeapon;
            this.reservedWeapon = NotReserved;
            return true;
        }
        return false;
    }

    hasReservedSupport() {
        return this.reservedSupport !== NotReserved;
    }

    restoreReservedSupport() {
        if (this.reservedSupport !== NotReserved) {
            this.support = this.reservedSupport;
            this.reservedSupport = NotReserved;
            return true;
        }
    }

    hasReservedSpecial() {
        return this.reservedSpecial !== NotReserved;
    }

    restoreReservedSpecial() {
        if (this.reservedSpecial !== NotReserved) {
            this.special = this.reservedSpecial;
            this.reservedSpecial = NotReserved;
            return true;
        }
        return false;
    }

    hasReservedPassiveA() {
        return this.reservedPassiveA !== NotReserved;
    }

    restoreReservedPassiveA() {
        if (this.reservedPassiveA !== NotReserved) {
            this.passiveA = this.reservedPassiveA;
            this.reservedPassiveA = NotReserved;
            return true;
        }
        return false;
    }

    hasReservedPassiveB() {
        return this.reservedPassiveB !== NotReserved;
    }

    restoreReservedPassiveB() {
        if (this.reservedPassiveB !== NotReserved) {
            this.passiveB = this.reservedPassiveB;
            this.reservedPassiveB = NotReserved;
            return true;
        }
        return false;
    }

    hasReservedPassiveC() {
        return this.reservedPassiveC !== NotReserved;
    }

    restoreReservedPassiveC() {
        if (this.reservedPassiveC !== NotReserved) {
            this.passiveC = this.reservedPassiveC;
            this.reservedPassiveC = NotReserved;
            return true;
        }
        return false;
    }

    hasReservedPassiveS() {
        return this.reservedPassiveS !== NotReserved;
    }

    restoreReservedPassiveS() {
        if (this.reservedPassiveS !== NotReserved) {
            this.passiveS = this.reservedPassiveS;
            this.reservedPassiveS = NotReserved;
            return true;
        }
        return false;
    }

    hasReservedPassiveX() {
        return this.reservedPassiveX !== NotReserved;
    }

    restoreReservedPassiveX() {
        if (this.reservedPassiveX !== NotReserved) {
            this.passiveX = this.reservedPassiveX;
            this.reservedPassiveX = NotReserved;
            return true;
        }
        return false;
    }

    /**
     * 攻撃可能なユニットを列挙します。
     * スタイル時は含みません。
     */
    * enumerateAttackableUnits() {
        for (let tile of this.attackableTiles) {
            let existsEnemyOnTile = tile.placedUnit != null && this.isDifferentGroup(tile.placedUnit);
            if (existsEnemyOnTile) {
                yield tile.placedUnit;
            }
        }
    }

    /**
     * スタイル時の攻撃可能なユニットを列挙します。
     */
    * enumerateAttackableUnitsInCannotMoveStyle() {
        for (let tile of this.attackableTilesInCannotMoveStyle) {
            let existsEnemyOnTile = tile.placedUnit != null && this.isDifferentGroup(tile.placedUnit);
            if (existsEnemyOnTile) {
                yield tile.placedUnit;
            }
        }
    }

    get atkBuff() {
        return Number(this._atkBuff);
    }

    set atkBuff(value) {
        this._atkBuff = Number(value);
    }

    get spdBuff() {
        return Number(this._spdBuff);
    }

    set spdBuff(value) {
        this._spdBuff = Number(value);
    }

    get defBuff() {
        return Number(this._defBuff);
    }

    set defBuff(value) {
        this._defBuff = Number(value);
    }

    get resBuff() {
        return Number(this._resBuff);
    }

    set resBuff(value) {
        this._resBuff = Number(value);
    }

    getAtkBuff() {
        return this.isPanicEnabled ? 0 : this.atkBuff;
    }

    getSpdBuff() {
        return this.isPanicEnabled ? 0 : this.spdBuff;
    }

    getDefBuff() {
        return this.isPanicEnabled ? 0 : this.defBuff;
    }

    getResBuff() {
        return this.isPanicEnabled ? 0 : this.resBuff;
    }

    get atkDebuff() {
        return Number(this._atkDebuff);
    }

    set atkDebuff(value) {
        this._atkDebuff = Number(value);
    }

    get spdDebuff() {
        return Number(this._spdDebuff);
    }

    set spdDebuff(value) {
        this._spdDebuff = Number(value);
    }

    get defDebuff() {
        return Number(this._defDebuff);
    }

    set defDebuff(value) {
        this._defDebuff = Number(value);
    }

    get resDebuff() {
        return Number(this._resDebuff);
    }

    set resDebuff(value) {
        this._resDebuff = Number(value);
    }

    clearSkills() {
        this.weapon = -1;
        this.weaponRefinement = WeaponRefinementType.None;
        this.support = -1;
        this.special = -1;
        this.passiveA = -1;
        this.passiveB = -1;
        this.passiveC = -1;
        this.passiveS = -1;
        this.passiveX = -1;
        this.captain = -1;
        this.weaponInfo = null;
        this.supportInfo = null;
        this.specialInfo = null;
        this.passiveAInfo = null;
        this.passiveBInfo = null;
        this.passiveCInfo = null;
        this.passiveSInfo = null;
        this.passiveXInfo = null;
        this.captainInfo = null;
    }

    resetStatusAdd() {
        this.hpAdd = 0;
        this.atkAdd = 0;
        this.spdAdd = 0;
        this.defAdd = 0;
        this.resAdd = 0;
    }

    resetStatusMult() {
        this.hpMult = 1.0;
        this.atkMult = 1.0;
        this.spdMult = 1.0;
        this.defMult = 1.0;
        this.resMult = 1.0;
    }

    resetStatusAdjustment() {
        this.resetStatusAdd();
        this.resetStatusMult();
    }

    get maxHpWithSkills() {
        let result = Math.floor(Number(this._maxHpWithSkills) * Number(this.hpMult) + Number(this.hpAdd));
        return Math.min(result, 99);
    }

    set maxHpWithSkillsWithoutAdd(value) {
        this._maxHpWithSkills = Math.min(value, 99);
    }

    get maxHpWithSkillsWithoutAdd() {
        return Number(this._maxHpWithSkills);
    }

    set maxHpWithSkills(value) {
        this._maxHpWithSkills = Math.min(value, 99);
        if (this.hp > this.maxHpWithSkills) {
            this.hp = this.maxHpWithSkills;
        }
    }

    get hpAddAfterEnteringBattle() {
        return this.#hpAddAfterEnteringBattle;
    }

    get maxHpWithSkillsWithoutEnteringBattleHpAdd() {
        return this._maxHpWithSkills - this.hpAddAfterEnteringBattle;
    }

    clearBlessingEffects() {
        this.blessingEffects = [];
        this.__clearBlessings();
    }

    __clearBlessings() {
        this.blessing1 = BlessingType.None;
        this.blessing2 = BlessingType.None;
        this.blessing3 = BlessingType.None;
        this.blessing4 = BlessingType.None;
        this.blessing5 = BlessingType.None;
        this.blessing6 = BlessingType.None;
    }

    addBlessingEffect(blessingEffect) {
        this.blessingEffects.push(blessingEffect);
    }

    __syncBlessingEffects() {
        this.__clearBlessings();
        if (this.blessingEffects.length > 0) {
            this.blessing1 = this.blessingEffects[0];
        }
        if (this.blessingEffects.length > 1) {
            this.blessing2 = this.blessingEffects[1];
        }
        if (this.blessingEffects.length > 2) {
            this.blessing3 = this.blessingEffects[2];
        }
        if (this.blessingEffects.length > 3) {
            this.blessing4 = this.blessingEffects[3];
        }
        if (this.blessingEffects.length > 4) {
            this.blessing5 = this.blessingEffects[4];
        }
        if (this.blessingEffects.length > 5) {
            this.blessing6 = this.blessingEffects[5];
        }
    }

    turnWideStatusToString() {
        let compressedPairUpUnitSetting = "0";
        if (this.hasPairUpUnit) {
            // ValueDelimiter の入れ子は対応していないのでURIに圧縮してしまう
            const pairUpUnitSetting = this.pairUpUnit.turnWideStatusToString();
            // noinspection JSUnresolvedReference
            compressedPairUpUnitSetting = LZString.compressToEncodedURIComponent(pairUpUnitSetting);
        }
        return this.heroIndex
            + ValueDelimiter + this.weapon
            + ValueDelimiter + this.support
            + ValueDelimiter + this.special
            + ValueDelimiter + this.passiveA
            + ValueDelimiter + this.passiveB
            + ValueDelimiter + this.passiveC
            + ValueDelimiter + this.passiveS
            + ValueDelimiter + this.blessing1
            + ValueDelimiter + this.blessing2
            + ValueDelimiter + this.blessing3
            + ValueDelimiter + this.merge
            + ValueDelimiter + this.dragonflower
            + ValueDelimiter + this.emblemHeroMerge
            + ValueDelimiter + this.ivHighStat
            + ValueDelimiter + this.ivLowStat
            + ValueDelimiter + this.summonerLevel
            + ValueDelimiter + boolToInt(this.isBonusChar)
            + ValueDelimiter + this.weaponRefinement
            + ValueDelimiter + this.partnerHeroIndex
            + ValueDelimiter + this.emblemHeroIndex
            + ValueDelimiter + this.partnerLevel
            + ValueDelimiter + this.slotOrder
            + ValueDelimiter + this.blessing4
            + ValueDelimiter + this.hpAdd
            + ValueDelimiter + this.atkAdd
            + ValueDelimiter + this.spdAdd
            + ValueDelimiter + this.defAdd
            + ValueDelimiter + this.resAdd
            + ValueDelimiter + this.blessing5
            + ValueDelimiter + this.grantedBlessing
            + ValueDelimiter + boolToInt(this.isResplendent)
            + ValueDelimiter + this.level
            + ValueDelimiter + this.rarity
            + ValueDelimiter + this.initPosX
            + ValueDelimiter + this.initPosY
            + ValueDelimiter + this.hpMult
            + ValueDelimiter + this.atkMult
            + ValueDelimiter + this.spdMult
            + ValueDelimiter + this.defMult
            + ValueDelimiter + this.resMult
            + ValueDelimiter + this.defGrowthRate
            + ValueDelimiter + this.resGrowthRate
            + ValueDelimiter + this.blessing6
            + ValueDelimiter + this.ascendedAsset
            + ValueDelimiter + this.captain
            + ValueDelimiter + this.passiveX
            + ValueDelimiter + boolToInt(this.isAidesEssenceUsed)
            + ValueDelimiter + this.reinforcementMerge
            + ValueDelimiter + compressedPairUpUnitSetting
            ;
    }

    perTurnStatusToString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + boolToInt(this.isActionDone)
            + ValueDelimiter + this.hp
            + ValueDelimiter + this.atkBuff
            + ValueDelimiter + this.spdBuff
            + ValueDelimiter + this.defBuff
            + ValueDelimiter + this.resBuff
            + ValueDelimiter + this.atkDebuff
            + ValueDelimiter + this.spdDebuff
            + ValueDelimiter + this.defDebuff
            + ValueDelimiter + this.resDebuff
            + ValueDelimiter + this.moveCount
            + ValueDelimiter + this.specialCount
            + ValueDelimiter + this.statusEffectsToString()
            + ValueDelimiter + boolToInt(this.isTransformed)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForSpecial)
            + ValueDelimiter + boolToInt(this.isDuoOrHarmonicSkillActivatedInThisTurn)
            + ValueDelimiter + this.duoOrHarmonizedSkillActivationCount
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForSupport)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForPassiveB)
            + ValueDelimiter + this.moveCountAtBeginningOfTurn
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForWeapon)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForWeapon2)
            + ValueDelimiter + boolToInt(this.isEnemyActionTriggered)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForShieldEffect)
            + ValueDelimiter + this.perTurnStatusesToString()
            + ValueDelimiter + this.distanceFromClosestEnemy
            + ValueDelimiter + this.movementOrder
            + ValueDelimiter + this.moveCountForCanto
            + ValueDelimiter + boolToInt(this.isCantoActivatedInCurrentTurn)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForFallenStar)
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForDeepStar)
            + ValueDelimiter + this.restMoveCount
            + ValueDelimiter + boolToInt(this.hasOncePerMapSpecialActivated)
            + ValueDelimiter + boolToInt(this.isAttackDone)
            + ValueDelimiter + boolToInt(this.isCantoActivating)
            + ValueDelimiter + this.fromPosX
            + ValueDelimiter + this.fromPosY
            + ValueDelimiter + boolToInt(this.isCombatDone)
            + ValueDelimiter + this.restWeaponSkillAvailableTurn
            + ValueDelimiter + this.restSupportSkillAvailableTurn
            + ValueDelimiter + this.restPassiveBSkillAvailableTurn
            + ValueDelimiter + boolToInt(this.isSupportDone)
            + ValueDelimiter + boolToInt(this.isAnotherActionInPostCombatActivated)
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Atk)
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Spd)
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Def)
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Res)
            + ValueDelimiter + boolToInt(this.isSupportedDone)
            + ValueDelimiter + boolToInt(this.hasGrantedAnotherActionAfterCombatInitiation)
            + ValueDelimiter + boolToInt(this.hasGrantedAnotherActionAfterActionWithoutCombat)
            + ValueDelimiter + this.cantoAssistType
            + ValueDelimiter + this.cantoAssistRange
            + ValueDelimiter + this.cantoSupport
            + ValueDelimiter + boolToInt(this.isOneTimeActionActivatedForCantoRefresh)
            + ValueDelimiter + JSON.stringify(Array.from(this.oneTimeActionPerTurnActivatedSet))
            + ValueDelimiter + this.anotherActionTurnForCallingCircle
            + ValueDelimiter + this.restStyleSkillAvailableTurn
            + ValueDelimiter + boolToInt(this.isStyleActive)
            + ValueDelimiter + boolToInt(this.isStyleActivatedInThisTurn)
            + ValueDelimiter + boolToInt(this.isAttackedDone)
            + ValueDelimiter + this.restSpecialSkillAvailableTurn
            ;
    }

    /**
     * @param  {String} value
     */
    fromTurnWideStatusString(value) {
        if (!value) {
            return;
        }
        let values = value.split(ValueDelimiter);
        let elemCount = values.length;
        let i = 0;
        // TODO: リファクタリング
        if (Number.isInteger(Number(values[i]))) { this.heroIndex = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.weapon = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.support = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.special = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveA = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveB = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveC = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveS = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing1 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing2 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing3 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.merge = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.dragonflower = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.emblemHeroMerge = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.ivHighStat = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.ivLowStat = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.summonerLevel = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isBonusChar = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.weaponRefinement = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.partnerHeroIndex = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.emblemHeroIndex = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.partnerLevel = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.slotOrder = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing4 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.hpAdd = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.atkAdd = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.spdAdd = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.defAdd = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.resAdd = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing5 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.grantedBlessing = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isResplendent = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.level = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.rarity = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.initPosX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.initPosY = Number(values[i]); ++i; }
        if (Number.isFinite(Number(values[i]))) { this.hpMult = Number(values[i]); ++i; }
        if (Number.isFinite(Number(values[i]))) { this.atkMult = Number(values[i]); ++i; }
        if (Number.isFinite(Number(values[i]))) { this.spdMult = Number(values[i]); ++i; }
        if (Number.isFinite(Number(values[i]))) { this.defMult = Number(values[i]); ++i; }
        if (Number.isFinite(Number(values[i]))) { this.resMult = Number(values[i]); ++i; }
        if (Number.isFinite(Number(values[i]))) { this.defGrowthRate = Number(values[i]); ++i; }
        if (Number.isFinite(Number(values[i]))) { this.resGrowthRate = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing6 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.ascendedAsset = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.captain = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isAidesEssenceUsed = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.reinforcementMerge = Number(values[i]); ++i; }
        if (i < elemCount) {
            this.__setPairUpUnitFromCompressedUri(values[i]); ++i;
        }
    }

    __setPairUpUnitFromCompressedUri(settingText) {
        this.__createPairUpUnitInstance();
        if (settingText === "0") {
            return;
        }

        // noinspection JSUnresolvedReference
        let decompressed = LZString.decompressFromEncodedURIComponent(settingText);
        this.pairUpUnit.fromTurnWideStatusString(decompressed);
    }

    fromPerTurnStatusString(value) {
        if (!value) {
            return;
        }
        let values = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(values[i]))) { this.ownerType = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posY = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isActionDone = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.hp = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.atkBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.spdBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.defBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.resBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.atkDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.spdDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.defDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.resDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this._moveCount = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.specialCount = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.setStatusEffectsFromString(values[i]); ++i; }
        if (values[i] !== undefined) { this.isTransformed = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForSpecial = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isDuoOrHarmonicSkillActivatedInThisTurn = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.duoOrHarmonizedSkillActivationCount = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForSupport = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForPassiveB = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.moveCountAtBeginningOfTurn = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForWeapon = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForWeapon2 = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isEnemyActionTriggered = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForShieldEffect = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.setPerTurnStatusesFromString(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.distanceFromClosestEnemy = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.movementOrder = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.moveCountForCanto = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isCantoActivatedInCurrentTurn = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForFallenStar = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForDeepStar = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.restMoveCount = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.hasOncePerMapSpecialActivated = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isAttackDone = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isCantoActivating = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.fromPosX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.fromPosY = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isCombatDone = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.restWeaponSkillAvailableTurn = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.restSupportSkillAvailableTurn = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.restPassiveBSkillAvailableTurn = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isSupportDone = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isAnotherActionInPostCombatActivated = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Atk, Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Spd, Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Def, Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Res, Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isSupportedDone = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.hasGrantedAnotherActionAfterCombatInitiation = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.hasGrantedAnotherActionAfterActionWithoutCombat = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.cantoAssistType = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.cantoAssistRange = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.cantoSupport = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isOneTimeActionActivatedForCantoRefresh = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.oneTimeActionPerTurnActivatedSet = new Set(JSON.parse(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.anotherActionTurnForCallingCircle = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.restStyleSkillAvailableTurn = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isStyleActive = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isStyleActivatedInThisTurn = intToBool(Number(values[i])); ++i; }
        if (values[i] !== undefined) { this.isAttackedDone = intToBool(Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.restSpecialSkillAvailableTurn = Number(values[i]); ++i; }
    }


    toString() {
        return this.ownerType
            + ValueDelimiter + this.posX
            + ValueDelimiter + this.posY
            + ValueDelimiter + this.heroIndex
            + ValueDelimiter + this.weapon
            + ValueDelimiter + this.support
            + ValueDelimiter + this.special
            + ValueDelimiter + this.passiveA
            + ValueDelimiter + this.passiveB
            + ValueDelimiter + this.passiveC
            + ValueDelimiter + this.passiveS
            + ValueDelimiter + this.blessing1
            + ValueDelimiter + this.blessing2
            + ValueDelimiter + this.blessing3
            + ValueDelimiter + this.merge
            + ValueDelimiter + this.dragonflower
            + ValueDelimiter + this.emblemHeroMerge
            + ValueDelimiter + this.ivHighStat
            + ValueDelimiter + this.ivLowStat
            + ValueDelimiter + this.summonerLevel
            + ValueDelimiter + boolToInt(this.isBonusChar)
            + ValueDelimiter + this.weaponRefinement
            + ValueDelimiter + boolToInt(this.isActionDone)
            + ValueDelimiter + this.hp
            + ValueDelimiter + this.atkBuff
            + ValueDelimiter + this.spdBuff
            + ValueDelimiter + this.defBuff
            + ValueDelimiter + this.resBuff
            + ValueDelimiter + this.atkDebuff
            + ValueDelimiter + this.spdDebuff
            + ValueDelimiter + this.defDebuff
            + ValueDelimiter + this.resDebuff
            + ValueDelimiter + this.moveCount
            + ValueDelimiter + this.specialCount
            + ValueDelimiter + this.statusEffectsToString()
            + ValueDelimiter + this.partnerHeroIndex
            + ValueDelimiter + this.emblemHeroIndex
            + ValueDelimiter + this.partnerLevel
            + ValueDelimiter + boolToInt(this.isTransformed)
            + ValueDelimiter + this.slotOrder
            + ValueDelimiter + boolToInt(this.isResplendent)
            + ValueDelimiter + this.moveCountAtBeginningOfTurn
            + ValueDelimiter + this.level
            + ValueDelimiter + this.rarity
            + ValueDelimiter + this.initPosX
            + ValueDelimiter + this.initPosY
            + ValueDelimiter + this.passiveX
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Atk)
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Spd)
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Def)
            + ValueDelimiter + this.getGreatTalent(STATUS_INDEX.Res)
            + ValueDelimiter + boolToInt(this.isAidesEssenceUsed)
            + ValueDelimiter + this.anotherActionTurnForCallingCircle
            + ValueDelimiter + this.reinforcementMerge
            ;
    }

    fromString(value) {
        if (!value) {
            return;
        }
        let values = value.split(ValueDelimiter);

        let i = 0;
        if (Number.isInteger(Number(values[i]))) { this.ownerType = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.posY = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.heroIndex = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.weapon = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.support = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.special = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveA = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveB = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveC = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveS = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing1 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing2 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.blessing3 = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.merge = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.dragonflower = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.emblemHeroMerge = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.ivHighStat = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.ivLowStat = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.summonerLevel = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isBonusChar = toBoolean(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.weaponRefinement = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isActionDone = toBoolean(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.hp = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.atkBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.spdBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.defBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.resBuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.atkDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.spdDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.defDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.resDebuff = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this._moveCount = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.specialCount = Number(values[i]); ++i; }
        this.setStatusEffectsFromString(values[i]); ++i;
        if (Number.isInteger(Number(values[i]))) { this.partnerHeroIndex = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.emblemHeroIndex = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.partnerLevel = Number(values[i]); ++i; }
        if (values[i] !== undefined) { this.isTransformed = toBoolean(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.slotOrder = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isResplendent = toBoolean(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.moveCountAtBeginningOfTurn = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.level = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.rarity = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.initPosX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.initPosY = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.passiveX = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Atk, Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Spd, Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Def, Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.setGreatTalent(STATUS_INDEX.Res, Number(values[i])); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.isAidesEssenceUsed = toBoolean(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.anotherActionTurnForCallingCircle = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.reinforcementMerge = Number(values[i]); ++i; }
    }

    // 応援を強制的に実行可能かどうか
    canRallyForcibly() {
        for (let skillId of this.enumerateSkills()) {
            if (canRallyForcibly(skillId, this)) {
                return true;
            }
        }
        return false;
    }

    // 被応援を強制的に実行可能か
    canRalliedForcibly() {
        for (let skillId of this.enumerateSkills()) {
            if (canRalliedForcibly(skillId, this)) {
                return true;
            }
        }
        return false;
    }

    get canGrantBlessing() {
        return !this.isLegendaryHero && !this.isMythicHero;
    }

    get isLegendaryHero() {
        return this.providableBlessingSeason !== SeasonType.None
            && !isMythicSeasonType(this.providableBlessingSeason);
    }

    get isMythicHero() {
        return isMythicSeasonType(this.providableBlessingSeason);
    }

    get isAttackMythicHero() {
        return this.providableBlessingSeason === SeasonType.Light
            || this.providableBlessingSeason === SeasonType.Astra;
    }

    /// 防衛神階かどうかを取得します。
    get isDefenseMythicHero() {
        return this.providableBlessingSeason === SeasonType.Anima
            || this.providableBlessingSeason === SeasonType.Dark;
    }

    includesProvidableBlessingSeason(seasons) {
        for (let season of seasons) {
            if (season === this.providableBlessingSeason) return true;
        }
        return false;
    }

    /**
     * @param seasonType
     * @returns {boolean}
     */
    canCallAsReinforcement(seasonType) {
        return this.providableBlessingSeason === seasonType || this.grantedBlessing === seasonType;
    }

    /**
     * @param {Iterable<number>} seasons
     * @param {boolean} isAllyGroup
     * @returns {boolean}
     */
    hasReinforcementAbility(seasons, isAllyGroup) {
        if (this.heroInfo.bookVersion >= 9) {
            if (isAllyGroup && this.isAttackMythicHero && this.includesProvidableBlessingSeason(seasons)) return true;
            if (!isAllyGroup && this.isDefenseMythicHero && this.includesProvidableBlessingSeason(seasons)) return true;
        }
        return false;
    }

    get atkDebuffTotal() {
        if (this.battleContext.invalidatesOwnAtkDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.atkDebuff - this.atkBuff;
        }
        return this.atkDebuff;
    }

    get spdDebuffTotal() {
        if (this.battleContext.invalidatesOwnSpdDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.spdDebuff - this.spdBuff;
        }
        return this.spdDebuff;
    }

    get defDebuffTotal() {
        if (this.battleContext.invalidatesOwnDefDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.defDebuff - this.defBuff;
        }
        return this.defDebuff;
    }

    get resDebuffTotal() {
        if (this.battleContext.invalidatesOwnResDebuff) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.resDebuff - this.resBuff;
        }
        return this.resDebuff;
    }

    /**
     * 弱化無効、パニックを考慮したデバフを返す(デバフ時に負の値)
     * @returns {number[]}
     */
    get debuffTotals() {
        return [
            this.atkDebuffTotal,
            this.spdDebuffTotal,
            this.defDebuffTotal,
            this.resDebuffTotal,
        ];
    }

    getAtkDebuffTotal(isPrecombat = false) {
        if (this.battleContext.invalidatesOwnAtkDebuff && !isPrecombat) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.atkDebuff - this.atkBuff;
        }
        return this.atkDebuff;
    }

    getSpdDebuffTotal(isPrecombat = false) {
        if (this.battleContext.invalidatesOwnSpdDebuff && !isPrecombat) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.spdDebuff - this.spdBuff;
        }
        return this.spdDebuff;
    }

    getDefDebuffTotal(isPrecombat = false) {
        if (this.battleContext.invalidatesOwnDefDebuff && !isPrecombat) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.defDebuff - this.defBuff;
        }
        return this.defDebuff;
    }

    getResDebuffTotal(isPrecombat = false) {
        if (this.battleContext.invalidatesOwnResDebuff && !isPrecombat) {
            return 0;
        }

        if (this.isPanicEnabled) {
            return this.resDebuff - this.resBuff;
        }
        return this.resDebuff;
    }

    getDebuffTotal(isPrecombat = false) {
        return this.getAtkDebuffTotal(isPrecombat) +
            this.getSpdDebuffTotal(isPrecombat) +
            this.getDefDebuffTotal(isPrecombat) +
            this.getResDebuffTotal(isPrecombat);
    }

    /**
     * @param {boolean} isPrecombat
     * @returns {[number, number, number, number]}
     */
    getDebuffTotals(isPrecombat = false) {
        return [
            this.getAtkDebuffTotal(isPrecombat),
            this.getSpdDebuffTotal(isPrecombat),
            this.getDefDebuffTotal(isPrecombat),
            this.getResDebuffTotal(isPrecombat),
        ];
    }

    isMeleeWeaponType() {
        return isMeleeWeaponType(this.weaponType);
    }

    isRangedWeaponType() {
        return isRangedWeaponType(this.weaponType);
    }

    /**
     * @returns {Unit}
     */
    createSnapshotIfNull() {
        if (this.snapshot !== null) {
            return this.snapshot;
        }

        this.snapshot = this.__createSnapshotImpl();
        return this.snapshot;
    }


    /**
     * @returns {Unit}
     */
    createSnapshot() {
        this.snapshot = this.__createSnapshotImpl();
        return this.snapshot;
    }

    __createSnapshotImpl() {
        this.snapshot = new Unit();
        this.snapshot._id = this._id;
        this.snapshot.maxSpecialCount = this.maxSpecialCount;
        this.snapshot._maxHp = this._maxHp;
        this.snapshot.hpAdd = this.hpAdd;
        this.snapshot.hpMult = this.hpMult;
        this.snapshot.restHp = this.restHp;
        this.snapshot.tmpSpecialCount = this.tmpSpecialCount;
        this.snapshot._atk = this._atk;
        this.snapshot._spd = this._spd;
        this.snapshot._def = this._def;
        this.snapshot._res = this._res;
        this.snapshot._maxHpWithSkills = this._maxHpWithSkills;
        this.snapshot.#hpAddAfterEnteringBattle = this.#hpAddAfterEnteringBattle;
        this.snapshot.atkWithSkills = this.atkWithSkills;
        this.snapshot.spdWithSkills = this.spdWithSkills;
        this.snapshot.defWithSkills = this.defWithSkills;
        this.snapshot.resWithSkills = this.resWithSkills;
        this.snapshot.weaponRefinement = this.weaponRefinement;
        this.snapshot.warFundsCost = this.warFundsCost;
        this.snapshot.level = this.level;
        this.snapshot.heroInfo = this.heroInfo;
        this.snapshot.weaponInfo = this.weaponInfo;
        this.snapshot.supportInfo = this.supportInfo;
        this.snapshot.specialInfo = this.specialInfo;
        this.snapshot.passiveAInfo = this.passiveAInfo;
        this.snapshot.passiveBInfo = this.passiveBInfo;
        this.snapshot.passiveCInfo = this.passiveCInfo;
        this.snapshot.passiveSInfo = this.passiveSInfo;
        this.snapshot.passiveXInfo = this.passiveXInfo;
        this.snapshot.captainInfo = this.captainInfo;
        this.snapshot.fromString(this.toString());
        this.snapshot._greatTalents = [...this.getGreatTalents()];
        return this.snapshot;
    }

    deleteSnapshot() {
        this.snapshot = null;
    }

    perTurnStatusesToString() {
        if (this.perTurnStatuses.length === 0) {
            return String(PerTurnStatusType.None);
        }
        let result = "";
        for (let elem of this.perTurnStatuses) {
            result += elem + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }

    setPerTurnStatusesFromString(value) {
        this.perTurnStatuses = [];
        if (value == null) {
            return;
        }
        if (Number(value) === PerTurnStatusType.None) {
            return;
        }
        for (let valueStr of value.split(ArrayValueElemDelimiter)) {
            if (valueStr === "") {
                continue;
            }
            let status = Number(valueStr);
            if (Number.isInteger(status)) {
                this.addPerTurnStatus(status);
            }
        }
    }

    /**
     * 状態変化の表示用の文字列を取得します。
     */
    statusEffectsToDisplayString() {
        if (this.countStatusEffects() === 0) {
            return "なし";
        }
        let result = this.getStatusEffects().reduce((prev, curr) => prev + getKeyByValue(StatusEffectType, curr) + " ", "");
        return result.substring(0, result.length - 1);
    }

    /**
     * 状態変化のシリアライズ用の文字列を取得します。
     */
    statusEffectsToString() {
        if (this.countStatusEffects() === 0) {
            return String(StatusEffectType.None);
        }
        let result = this.getStatusEffects().reduce((prev, curr) => prev + curr + ArrayValueElemDelimiter, "");
        return result.substring(0, result.length - 1);
    }

    setStatusEffectsFromString(value) {
        if (value == null) {
            return;
        }
        if (Number(value) === StatusEffectType.None) {
            return;
        }
        /** @type {Set<number>} */
        let statusEffectSet = new Set();
        for (let valueStr of value.split(ArrayValueElemDelimiter)) {
            if (valueStr === "") {
                continue;
            }
            let statusEffect = Number(valueStr);
            if (Number.isInteger(statusEffect)) {
                statusEffectSet.add(statusEffect);
            }
        }
        this.forceSetStatusEffects(...statusEffectSet);
    }

    addAllSpur(amount) {
        let amountNum = Number(amount);
        this.atkSpur += amountNum;
        this.spdSpur += amountNum;
        this.defSpur += amountNum;
        this.resSpur += amountNum;
    }

    /**
     * @param {number} atk
     * @param {number} spd
     * @param {number} def
     * @param {number} res
     */
    addSpurs(atk, spd, def, res) {
        this.atkSpur += atk;
        this.spdSpur += spd;
        this.defSpur += def;
        this.resSpur += res;
    }

    addAtkSpdSpurs(atk, spd = atk) {
        this.atkSpur += atk;
        this.spdSpur += spd;
    }

    addAtkDefSpurs(atk, def = atk) {
        this.atkSpur += atk;
        this.defSpur += def;
    }

    addAtkResSpurs(atk, res = atk) {
        this.atkSpur += atk;
        this.resSpur += res;
    }

    addSpdDefSpurs(spd, def = spd) {
        this.spdSpur += spd;
        this.defSpur += def;
    }

    addSpdResSpurs(spd, res = spd) {
        this.spdSpur += spd;
        this.resSpur += res;
    }

    addDefResSpurs(def, res = def) {
        this.defSpur += def;
        this.resSpur += res;
    }

    addSpursWithoutAtk(spd, def = spd, res = spd) {
        this.spdSpur += spd;
        this.defSpur += def;
        this.resSpur += res;
    }

    addSpursWithoutSpd(atk, def = atk, res = atk) {
        this.atkSpur += atk;
        this.defSpur += def;
        this.resSpur += res;
    }

    addSpursWithoutDef(atk, spd = atk, res = atk) {
        this.atkSpur += atk;
        this.spdSpur += spd;
        this.resSpur += res;
    }

    addSpursWithoutRes(atk, spd = atk, def = atk) {
        this.atkSpur += atk;
        this.spdSpur += spd;
        this.defSpur += def;
    }

    getSpurs() {
        return [this.atkSpur, this.spdSpur, this.defSpur, this.resSpur];
    }

    get isHarmonicAllyHero() {
        let isInHero = Object.values(Hero).includes(this.heroIndex);
        let isDuo = DUO_HERO_SET.has(this.heroIndex);
        return this.heroInfo != null && isInHero && !isDuo && this.groupId === UnitGroupType.Ally;
    }

    get isDuoAllyHero() {
        let isDuo = DUO_HERO_SET.has(this.heroIndex);
        return this.heroInfo != null && isDuo && this.groupId === UnitGroupType.Ally;
    }

    /**
     * 出典の集合を返す。
     * @param {[Unit]|Generator<Unit>} units
     * @return {Set<String>}
     */
    static getTitleSet(units) {
        return SetUtil.union(...Array.from(units).map(u => u.getTitleSet()));
    }

    get hasWeapon() {
        return this.weapon !== Weapon.None;
    }

    get hasSpecial() {
        return this.special !== Special.None;
    }

    get isSpecialCharged() {
        return this.hasSpecial && this.specialCount === 0;
    }

    isAdvantageForColorless() {
        return isAdvantageousForColorless(this.weapon) || this.battleContext.isAdvantageForColorless;
    }

    getBuffTotalInPreCombat() {
        return this.getBuffsInPreCombat().reduce((a, b) => a + b, 0);
    }

    getBuffTotalInCombat(enemyUnit) {
        return this.getAtkBuffInCombat(enemyUnit)
            + this.getSpdBuffInCombat(enemyUnit)
            + this.getDefBuffInCombat(enemyUnit)
            + this.getResBuffInCombat(enemyUnit);
    }

    getDebuffTotalInCombat() {
        return this.getAtkDebuffInCombat()
            + this.getSpdDebuffInCombat()
            + this.getDefDebuffInCombat()
            + this.getResDebuffInCombat();
    }

    // noinspection JSUnusedGlobalSymbols
    getDebuffsInCombat() {
        return [
            this.getAtkDebuffInCombat(),
            this.getSpdDebuffInCombat(),
            this.getDefDebuffInCombat(),
            this.getResDebuffInCombat(),
        ];
    }

    get buffTotal() {
        if (this.isPanicEnabled) {
            return 0;
        }
        return this.atkBuff + this.spdBuff + this.defBuff + this.resBuff;
    }

    /**
     * @returns {[number, number, number, number]}
     */
    get buffs() {
        if (this.isPanicEnabled) {
            return [-this.atkBuff, -this.spdBuff, -this.defBuff, -this.resBuff];
        }
        return [this.atkBuff, this.spdBuff, this.defBuff, this.resBuff];
    }

    /**
     * @returns {[number, number, number, number]}
     */
    getBuffs(considerPanic = true) {
        if (considerPanic) {
            return this.buffs;
        }
        return [this.atkBuff, this.spdBuff, this.defBuff, this.resBuff];
    }

    get debuffTotal() {
        return this.atkDebuffTotal + this.spdDebuffTotal + this.defDebuffTotal + this.resDebuffTotal;
    }

    isWeaponEffectiveAgainst(type) {
        if (this.weaponInfo != null) {
            for (let effective of this.weaponInfo.effectives) {
                if (effective === type) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * @param {number} type - EffectiveType
     * @return {boolean}
     */
    hasEffective(type) {
        if (this.isWeaponEffectiveAgainst(type)) {
            return true;
        }

        if (type === EffectiveType.Dragon) {
            if (this.hasStatusEffect(StatusEffectType.EffectiveAgainstDragons)) {
                return true;
            }
        }
        return false;
    }

    calculateDistanceToUnit(unit) {
        if (this.placedTile == null || unit.placedTile == null) {
            return CanNotReachTile;
        }
        return this.placedTile.calculateDistanceToUnit(unit);
    }

    reserveToAddStatusEffect(statusEffect) {
        if (this.reservedStatusEffects.some(x => x === statusEffect)) {
            return;
        }
        this.reservedStatusEffects.push(statusEffect);
    }

    /**
     * @param {...number} statusEffects
     */
    reserveToAddStatusEffects(...statusEffects) {
        for (let effect of statusEffects) {
            this.reserveToAddStatusEffect(effect);
        }
    }

    reserveToApplyAtkBuff(value) {
        this.reservedAtkBuff = Math.max(this.reservedAtkBuff, value);
    }

    reserveToApplySpdBuff(value) {
        this.reservedSpdBuff = Math.max(this.reservedSpdBuff, value);
    }

    reserveToApplyDefBuff(value) {
        this.reservedDefBuff = Math.max(this.reservedDefBuff, value);
    }

    reserveToApplyResBuff(value) {
        this.reservedResBuff = Math.max(this.reservedResBuff, value);
    }

    reserveToApplyAllBuffs(value) {
        this.reserveToApplyAtkBuff(value);
        this.reserveToApplySpdBuff(value);
        this.reserveToApplyDefBuff(value);
        this.reserveToApplyResBuff(value);
    }

    reserveToNeutralizeNegativeStatusEffects() {
        this.getNegativeStatusEffects().forEach(e => this.reservedStatusEffectSetToNeutralize.add(e));
    }

    /**
     * @param statusEffect
     * @returns {boolean} Return true if had the status effect and removed.
     */
    removeStatusEffects(statusEffect) {
        let lengthBefore = this.getStatusEffects().length;
        this.forceSetStatusEffects(...this.getStatusEffects().filter(e => e !== statusEffect));
        return lengthBefore !== this.getStatusEffects().length;
    }

    /**
     * @param {number} statusEffect
     */
    neutralizeStatusEffect(statusEffect) {
        let removed = this.removeStatusEffects(statusEffect);
        if (statusEffect === StatusEffectType.Schism && removed) {
            this.neutralizePositiveStatusEffect(StatusEffectType.TriangleAttack);
            this.neutralizePositiveStatusEffect(StatusEffectType.DualStrike);
            this.neutralizePositiveStatusEffect(StatusEffectType.Pathfinder);
        }
        if (statusEffect === StatusEffectType.GrandStrategy && removed) {
            this.neutralizeAllDebuffs();
        }
    }

    /**
     * @param {number[]} statusEffects
     */
    neutralizeStatusEffects(statusEffects) {
        statusEffects.forEach(e => this.neutralizeStatusEffect(e));
    }

    neutralizeReservedStatusEffectsToNeutralize() {
        this.neutralizeStatusEffects([...this.reservedStatusEffectSetToNeutralize]);
        this.reservedStatusEffectSetToNeutralize.clear();

        // TODO: 予約解除の順序を検証する
        let getValue = k => NEGATIVE_STATUS_EFFECT_ORDER_MAP.get(k) ?? Number.MAX_SAFE_INTEGER;
        let effects = this.getNegativeStatusEffects().sort((a, b) => getValue(a) - getValue(b));
        for (let i = 0; i < this.reservedStatusEffectCountInOrder; i++) {
            if (effects.length >= i + 1) {
                this.reservedStatusEffectSetToNeutralize.add(effects[i]);
                this.neutralizeStatusEffect(effects[i]);
            }
        }
        this.reservedStatusEffectCountInOrder = 0;
    }

    neutralizeNegativeStatusEffects() {
        this.getNegativeStatusEffects().forEach(e => this.neutralizeStatusEffect(e));
    }

    neutralizeNegativeStatusEffectsAtEndOfAction() {
        this.neutralizeNegativeStatusEffects();
    }

    neutralizePositiveStatusEffect(statusEffect) {
        this.neutralizeStatusEffect(statusEffect);
    }

    neutralizePositiveStatusEffects() {
        this.getPositiveStatusEffects().forEach(e => this.neutralizePositiveStatusEffect(e));
    }

    neutralizePositiveStatusEffectsAtStartOfTurn() {
        this.neutralizePositiveStatusEffects();
    }

    // 弱化以外の状態異常が付与されているか
    hasNonStatDebuff() {
        return this.getNegativeStatusEffects().length > 0;
    }

    // 弱化が付与されているか
    hasStatDebuff() {
        let debuffs = this.getDebuffs();
        let invalidations = this.battleContext.getDebuffInvalidations();
        return invalidations.some((invalidates, i) => debuffs[i] < 0 && !invalidates);
    }

    // 状態異常が付与されているか
    hasNegativeStatusEffect() {
        return this.hasNonStatDebuff() || this.hasStatDebuff();
    }

    hasPositiveStatusEffect(enemyUnit = null) {
        if (this.getPositiveStatusEffects().length > 0) {
            return true;
        }
        let buffs = enemyUnit == null ? this.buffs : this.getBuffsInCombat(enemyUnit);
        return buffs.some(buff => buff > 0);
    }

    /**
     * @param {...number} effects
     */
    forceSetStatusEffects(...effects) {
        this.#statusEffects = [...effects];
    }

    forceRemoveStatusEffect(statusEffect) {
        this.forceSetStatusEffects(...this.getStatusEffects().filter(e => e !== statusEffect));
    }

    forceAddStatusEffect(statusEffect) {
        this.forceSetStatusEffects(...this.getStatusEffects(), statusEffect);
    }

    get statusEffects() {
        return this.#statusEffects;
    }

    getStatusEffects() {
        return [...this.#statusEffects];
    }

    countStatusEffects() {
        return this.getStatusEffects().length;
    }

    __getPositiveStatusEffects(statusEffects) {
        return statusEffects.filter(e => isPositiveStatusEffect(e));
    }

    getPositiveStatusEffects() {
        return this.__getPositiveStatusEffects(this.getStatusEffects());
    }

    getNegativeStatusEffects() {
        return this.getStatusEffects().filter(e => isNegativeStatusEffect(e));
    }

    /**
     * @returns {number[]}
     */
    getNegativeStatusEffectsOrderedByNeutralizationPriority() {
        let getValue = k => NEGATIVE_STATUS_EFFECT_ORDER_MAP.get(k) ?? Number.MAX_SAFE_INTEGER;
        return this.getNegativeStatusEffects().sort((a, b) => getValue(a) - getValue(b));
    }

    /**
     * @param {number} statusEffectType
     */
    addStatusEffect(statusEffectType) {
        let units = g_appData.enumerateAllUnitsOnMap();
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
        this.#statusEffects.push(statusEffectType);
    }

    /**
     * @param  {number[]} statusEffects
     */
    addStatusEffects(statusEffects) {
        for (let item of statusEffects) {
            this.addStatusEffect(item);
        }
    }

    clearPerTurnStatuses() {
        this.perTurnStatuses = [];
    }

    hasPassStatus() {
        return this.hasPerTurnStatus(PerTurnStatusType.Pass);
    }

    addPerTurnStatus(value) {
        if (this.hasPerTurnStatus(value)) {
            return;
        }
        this.perTurnStatuses.push(value);
    }

    get hasAnyStatusEffect() {
        return this.getStatusEffects().length > 0;
    }

    hasPerTurnStatus(value) {
        for (let elem of this.perTurnStatuses) {
            if (elem === value) {
                return true;
            }
        }
        return false;
    }

    hasStatusEffect(statusEffectType) {
        return this.getStatusEffects().includes(statusEffectType);
    }

    isNextTo(unit) {
        let dist = Math.abs(this.posX - unit.posX) + Math.abs(this.posY - unit.posY);
        return dist === 1;
    }

    /**
     * 実際の射程を取得（リンのスタイルの場合2）。
     * @param attackTargetUnit
     * @returns {*|number}
     */
    getActualAttackRange(attackTargetUnit) {
        if (this.isCantoActivated()) {
            return 0;
        }
        if (this.isCannotMoveStyleActive()) {
            return 2;
        }

        return calcDistance(this.posX, this.posY, attackTargetUnit.posX, attackTargetUnit.posY);
    }

    /// すり抜けを発動可能ならtrue、そうでなければfalseを返します。
    canActivatePass() {
        let env = new NodeEnv().setUnitManager(g_appData).setTarget(this).setSkillOwner(this);
        // TODO: ログの出し方を考える
        // env.setName('すり抜け').setLogLevel(getSkillLogLevel());
        env.setName('すり抜け');
        if (UNIT_CAN_MOVE_THROUGH_FOES_SPACES_HOOKS.evaluateSomeWithUnit(this, env)) {
            return true;
        }
        for (let skillId of this.enumerateSkills()) {
            if (CAN_MOVE_THROUGH_FOES_SPACE_SKILL_SET.has(skillId)) {
                return true;
            }
        }
        return (this.passiveB === PassiveB.Surinuke3 && this.hpPercentage >= 25)
            || (this.weapon === Weapon.FujinYumi && !this.isWeaponRefined && this.hpPercentage >= 50);
    }

    /// 2マス以内の敵に進軍阻止を発動できるならtrue、そうでなければfalseを返します。
    canActivateObstructToTilesIn2Spaces(moveUnit) {
        let hasSkills = false;
        let env = new NodeEnv().setSkillOwner(this).setTarget(moveUnit);
        // env.setName('移動時(2マス以内)').setLogLevel(getSkillLogLevel());
        env.setName('移動時(2マス以内)').setLogLevel(LoggerBase.LOG_LEVEL.WARN);
        hasSkills |=
            CANNOT_FOE_MOVE_THROUGH_SPACES_WITHIN_2_SPACES_OF_UNIT_HOOKS.evaluateSomeWithUnit(this, env);
        for (let skillId of this.enumerateSkills()) {
            let func = getSkillFunc(skillId, canActivateObstructToTilesIn2SpacesFuncMap);
            if (func?.call(this, moveUnit) ?? false) {
                hasSkills = true;
                break;
            }
        }
        hasSkills |=
            this.weapon === Weapon.CaptainsSword ||
            this.passiveB === PassiveB.AtkSpdBulwark3 ||
            this.passiveB === PassiveB.AtkDefBulwark3 ||
            this.passiveB === PassiveB.SpdDefBulwark3 ||
            this.passiveB === PassiveB.SpdResBulwark3 ||
            this.passiveB === PassiveB.DetailedReport;
        return hasSkills && moveUnit.isRangedWeaponType();
    }

    /// 隣接マスの敵に進軍阻止を発動できるならtrue、そうでなければfalseを返します。
    canActivateObstructToAdjacentTiles(moveUnit) {
        let hasSkills = this.hasStatusEffect(StatusEffectType.Bulwark);
        let env = new NodeEnv().setSkillOwner(this).setTarget(moveUnit);
        // env.setName('移動時(1マス以内)').setLogLevel(getSkillLogLevel());
        env.setName('移動時(1マス以内)').setLogLevel(LoggerBase.LOG_LEVEL.WARN);
        hasSkills |=
            CANNOT_FOE_MOVE_THROUGH_SPACES_ADJACENT_TO_UNIT_HOOKS.evaluateSomeWithUnit(this, env);
        for (let skillId of this.enumerateSkills()) {
            let func = getSkillFunc(skillId, canActivateObstructToAdjacentTilesFuncMap);
            if (func?.call(this, moveUnit) ?? false) {
                hasSkills = true;
                break;
            }
        }
        hasSkills |=
            this.passiveB === PassiveB.ShingunSoshi3 && this.hpPercentage >= 50 ||
            this.weapon === Weapon.CaptainsSword ||
            this.passiveB === PassiveB.DetailedReport ||
            this.passiveB === PassiveB.AtkSpdBulwark3 ||
            this.passiveB === PassiveB.AtkDefBulwark3 ||
            this.passiveB === PassiveB.SpdDefBulwark3 ||
            this.passiveB === PassiveB.SpdResBulwark3;
        return hasSkills || (this.passiveS === PassiveS.GoeiNoGuzo && moveUnit.isRangedWeaponType());
    }

    get isOnMap() {
        return this.placedTile != null;
    }

    get isBuffed() {
        return this.isPanicEnabled ? false : this.getBuffs(false).some(b => b > 0);
    }

    // 強化無効を考慮
    isBuffedInCombat(enemyUnit) {
        return this.isPanicEnabled ? false : this.getBuffsInCombat(enemyUnit).some(b => b > 0);
    }

    get isDebuffed() {
        return this.atkDebuff < 0 ||
            this.spdDebuff < 0 ||
            this.defDebuff < 0 ||
            this.resDebuff < 0;
    }

    /**
     * @returns {[number, number, number, number]}
     */
    getDebuffs() {
        return [
            this.atkDebuff,
            this.spdDebuff,
            this.defDebuff,
            this.resDebuff,
        ];
    }

    get isSpecialCountMax() {
        return this.specialCount === this.maxSpecialCount;
    }

    setSpecialCountToMax() {
        this.specialCount = this.maxSpecialCount;
    }

    resetAllState() {
        this.hp = this.maxHpWithSkills;
        this.specialCount = this.maxSpecialCount;
        this.isActionDone = false;
        this.isAttackDone = false;
        this.isAttackedDone = false;
        this.isTransformed = false;
        this.setMoveCountFromMoveType();
        this.forceResetBuffs();
        this.forceResetDebuffs();
        this.forceSetStatusEffects(...[]);
        this.duoOrHarmonizedSkillActivationCount = 0;
        this.isDuoOrHarmonicSkillActivatedInThisTurn = false;
        this.initPosX = this.posX;
        this.initPosY = this.posY;
        this.fromPosX = this.posX;
        this.fromPosY = this.posY;
        this.isEnemyActionTriggered = this.groupId !== UnitGroupType.Enemy;
        this.forceResetGreatTalents();
        this.anotherActionTurnForCallingCircle = -1;
        this.deactivateStyle();
    }

    resetSpurs() {
        this.atkSpur = 0;
        this.spdSpur = 0;
        this.defSpur = 0;
        this.resSpur = 0;
    }

    copySpursToSnapshot() {
        if (this.snapshot === null) {
            return;
        }

        this.snapshot.atkSpur = this.atkSpur;
        this.snapshot.spdSpur = this.spdSpur;
        this.snapshot.defSpur = this.defSpur;
        this.snapshot.resSpur = this.resSpur;
        this.snapshot.battleContext.invalidatesAtkBuff = this.battleContext.invalidatesAtkBuff;
        this.snapshot.battleContext.invalidatesSpdBuff = this.battleContext.invalidatesSpdBuff;
        this.snapshot.battleContext.invalidatesDefBuff = this.battleContext.invalidatesDefBuff;
        this.snapshot.battleContext.invalidatesResBuff = this.battleContext.invalidatesResBuff;
        this.snapshot._greatTalents = [...this._greatTalents];
    }

    /**
     * @param {boolean} atk
     * @param {boolean} spd
     * @param {boolean} def
     * @param {boolean} res
     */
    neutralizeBuffs(atk, spd, def, res) {
        if (atk) this.atkBuff = 0;
        if (spd) this.spdBuff = 0;
        if (def) this.defBuff = 0;
        if (res) this.resBuff = 0;
    }

    neutralizeAllBuffs() {
        this.neutralizeBuffs(true, true, true, true);
    }

    neutralizeBuffsAtStartOfAction() {
        this.neutralizeAllBuffs();
    }

    neutralizeReservedBuffsToNeutralize() {
        this.neutralizeBuffs(...this.reservedBuffFlagsToNeutralize);
        // clear
        this.reservedBuffFlagsToNeutralize = [false, false, false, false];
    }

    neutralizeReservedStateToNeutralize() {
        this.neutralizeReservedBuffsToNeutralize();
        this.neutralizeReservedDebuffsToNeutralize();
        this.neutralizeReservedStatusEffectsToNeutralize();
    }

    forceResetBuffs() {
        this.atkBuff = 0;
        this.spdBuff = 0;
        this.defBuff = 0;
        this.resBuff = 0;
    }

    // TODO: 削除する
    reserveToResetDebuffs() {
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
    }

    /**
     * @param {boolean} atk
     * @param {boolean} spd
     * @param {boolean} def
     * @param {boolean} res
     */
    neutralizeDebuffs(atk, spd, def, res) {
        if (atk) this.atkDebuff = 0;
        if (spd) this.spdDebuff = 0;
        if (def) this.defDebuff = 0;
        if (res) this.resDebuff = 0;
    }

    neutralizeAllDebuffs() {
        this.neutralizeDebuffs(true, true, true, true);
    }

    neutralizeReservedDebuffsToNeutralize() {
        this.neutralizeDebuffs(...this.reservedDebuffFlagsToNeutralize);
        // clear
        this.reservedDebuffFlagsToNeutralize = [false, false, false, false];
    }

    forceResetDebuffs() {
        this.atkDebuff = 0;
        this.spdDebuff = 0;
        this.defDebuff = 0;
        this.resDebuff = 0;
    }

    neutralizeDebuffsAtEndOfAction() {
        if (this.hasStatusEffect(StatusEffectType.GrandStrategy)) {
            return;
        }
        this.neutralizeAllDebuffs();
    }

    resetOneTimeActionActivationStates() {
        this.isOneTimeActionActivatedForWeapon = false;
        this.isOneTimeActionActivatedForWeapon2 = false;
        this.isOneTimeActionActivatedForSpecial = false;
        this.isOneTimeActionActivatedForSupport = false;
        this.isOneTimeActionActivatedForPassiveB = false;
        this.isOneTimeActionActivatedForShieldEffect = false;
        this.isOneTimeActionActivatedForFallenStar = false;
        this.isOneTimeActionActivatedForDeepStar = false;
        this.hasGrantedAnotherActionAfterCombatInitiation = false;
        this.hasGrantedAnotherActionAfterActionWithoutCombat = false;
        this.isCantoActivatedInCurrentTurn = false;
        this.isAnotherActionInPostCombatActivated = false;
        this.isOneTimeActionActivatedForCantoRefresh = false;
        this.oneTimeActionPerTurnActivatedSet = new Set();
        this.deactivateStyle();
    }

    setOnetimeActionActivated() {
        // 最初の戦闘のみで発動する状態効果は、状態が付与されていない戦闘も最初の戦闘にカウントするので
        // 強制的にtrueにする

        this.isOneTimeActionActivatedForShieldEffect = true;
        this.isOneTimeActionActivatedForFallenStar = true;
        if (!this.battleContext.initiatesCombat) {
            this.isOneTimeActionActivatedForDeepStar = true;
        }

        for (let skillId of this.enumerateSkills()) {
            getSkillFunc(skillId, setOnetimeActionActivatedFuncMap)?.call(this);
            switch (skillId) {
                case PassiveB.GuardBearing4:
                    // 各ターンについてこのスキル所持者が敵から攻撃された最初の戦闘の時
                    if (!this.battleContext.initiatesCombat) {
                        this.isOneTimeActionActivatedForPassiveB = true;
                    }
                    break;
                case PassiveB.TrueDragonWall:
                case PassiveB.ArmoredWall:
                case PassiveB.GuardBearing3:
                    this.isOneTimeActionActivatedForPassiveB = true;
                    break;
            }
        }
    }

    isOnInitPos() {
        return this.posX === this.initPosX && this.posY === this.initPosY;
    }

    beginAction() {
        if (!this.isActionDone) {
            return;
        }

        this.isActionDone = false;
        this.isAttackDone = false;
        this.isAttackedDone = false;
        // TODO: リセットの場所がここで良いか検証する
        this.isStyleActivatedInThisTurn = false;
        this.neutralizeBuffsAtStartOfAction();
        this.setMoveCountFromMoveType();
        this.neutralizePositiveStatusEffectsAtStartOfTurn();
        this.deactivateStyle();
    }

    // 行動終了状態にする
    endAction() {
        this.deactivateCanto();
        if (this.isActionDone) {
            return;
        }

        this.isActionDone = true;
        if (this.isMovementRestricted) {
            this.setMoveCountFromMoveType();
        }
        this.neutralizeDebuffsAtEndOfAction();
        this.neutralizeNegativeStatusEffectsAtEndOfAction();
    }

    endActionBySkillEffect() {
        let units = g_appData.enumerateAllUnitsOnMap();
        for (let unit of units) {
            let env = new NeutralizingEndActionEnv(unit, this);
            env.setName('スキルによる行動終了時').setLogLevel(getSkillLogLevel());
            if (CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS.evaluateSomeWithUnit(unit, env)) {
                return;
            }
        }
        this.endAction();
    }

    endActionByStatusEffect() {
        let units = g_appData.enumerateAllUnitsOnMap();
        for (let unit of units) {
            let env = new NeutralizingEndActionEnv(unit, this);
            env.setName('ステータスによる行動終了時').setLogLevel(getSkillLogLevel());
            if (CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS.evaluateSomeWithUnit(unit, env)) {
                return;
            }
        }
        this.endAction();
    }

    applyEndActionSkills() {
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
            .setBattleMap(g_appData.map);
        env.setName('行動後or再移動後').setLogLevel(getSkillLogLevel());
        AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS.evaluateWithUnit(this, env);
        for (let unit of g_appData.enumerateAllUnitsOnMap()) {
            unit.applyReservedState(false);
        }
    }

    applyAllBuff(amount) {
        this.applyAtkBuff(amount);
        this.applySpdBuff(amount);
        this.applyDefBuff(amount);
        this.applyResBuff(amount);
    }

    reserveToApplyAllDebuff(amount) {
        this.reserveToApplyAtkDebuff(amount);
        this.reserveToApplySpdDebuff(amount);
        this.reserveToApplyDefDebuff(amount);
        this.reserveToApplyResDebuff(amount);
    }

    reserveToApplyDebuffs(atk, spd, def, res) {
        this.reserveToApplyAtkDebuff(atk);
        this.reserveToApplySpdDebuff(spd);
        this.reserveToApplyDefDebuff(def);
        this.reserveToApplyResDebuff(res);
    }

    applyAllDebuff(amount) {
        this.applyAtkDebuff(amount);
        this.applySpdDebuff(amount);
        this.applyDefDebuff(amount);
        this.applyResDebuff(amount);
    }

    getHighestStatuses() {
        let maxStatuses = [StatusType.Atk];
        let unit = this;
        let maxValue = unit.getAtkInPrecombat() - 15; // 攻撃は-15して比較
        let statuses = [
            [unit.getSpdInPrecombat(), StatusType.Spd],
            [unit.getDefInPrecombat(), StatusType.Def],
            [unit.getResInPrecombat(), StatusType.Res],
        ];
        for (let [value, type] of statuses) {
            if (value > maxValue) {
                maxStatuses = [type];
                maxValue = value;
            } else if (value === maxValue) {
                maxStatuses.push(type);
            }
        }
        return maxStatuses;
    }

    applyAtkBuff(buffAmount) {
        if (this.atkBuff < buffAmount) {
            this.atkBuff = buffAmount;
            return true;
        }
        return false;
    }

    applySpdBuff(buffAmount) {
        if (this.spdBuff < buffAmount) {
            this.spdBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyDefBuff(buffAmount) {
        if (this.defBuff < buffAmount) {
            this.defBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyResBuff(buffAmount) {
        if (this.resBuff < buffAmount) {
            this.resBuff = buffAmount;
            return true;
        }
        return false;
    }

    applyBuffs(atk, spd, def, res) {
        this.applyAtkBuff(atk);
        this.applySpdBuff(spd);
        this.applyDefBuff(def);
        this.applyResBuff(res);
    }

    reserveToApplyBuffs(atk, spd, def, res) {
        this.reservedAtkBuff = Math.max(this.reservedAtkBuff, atk);
        this.reservedSpdBuff = Math.max(this.reservedSpdBuff, spd);
        this.reservedDefBuff = Math.max(this.reservedDefBuff, def);
        this.reservedResBuff = Math.max(this.reservedResBuff, res);
    }

    reserveToIncreaseAllBuffs(amount, max) {
        if (this.atkBuff > 0) {
            this.reserveToApplyAtkBuff(MathUtil.ensureMax(this.atkBuff + amount, max));
        }
        if (this.spdBuff > 0) {
            this.reserveToApplySpdBuff(MathUtil.ensureMax(this.spdBuff + amount, max));
        }
        if (this.defBuff > 0) {
            this.reserveToApplyDefBuff(MathUtil.ensureMax(this.defBuff + amount, max));
        }
        if (this.resBuff > 0) {
            this.reserveToApplyResBuff(MathUtil.ensureMax(this.resBuff + amount, max));
        }
    }

    applyAtkSpdBuffs(atk, spd = atk) {
        this.applyAtkBuff(atk);
        this.applySpdBuff(spd);
    }

    applyAtkDefBuffs(atk, def = atk) {
        this.applyAtkBuff(atk);
        this.applyDefBuff(def);
    }

    applySpdDefBuffs(spd, def = spd) {
        this.applySpdBuff(spd);
        this.applyDefBuff(def);
    }

    applyDefResBuffs(def, res = def) {
        this.applyDefBuff(def);
        this.applyResBuff(res);
    }

    reserveToApplyAtkDebuff(amount) {
        if (this.reservedAtkDebuff > amount) {
            this.reservedAtkDebuff = amount;
            return true;
        }
        return false;
    }

    reserveToApplySpdDebuff(amount) {
        if (this.reservedSpdDebuff > amount) {
            this.reservedSpdDebuff = amount;
            return true;
        }
        return false;
    }

    reserveToApplyDefDebuff(amount) {
        if (this.reservedDefDebuff > amount) {
            this.reservedDefDebuff = amount;
            return true;
        }
        return false;
    }

    reserveToApplyResDebuff(amount) {
        if (this.reservedResDebuff > amount) {
            this.reservedResDebuff = amount;
            return true;
        }
        return false;
    }

    reserveToIncreaseSpecialCount(amount) {
        this.reservedSpecialCount += amount;
    }

    reserveToReduceSpecialCount(amount) {
        this.reservedSpecialCount -= amount;
    }

    applyReservedSpecialCount() {
        this.specialCount += this.reservedSpecialCount;
        this.specialCount = MathUtil.ensureMinMax(this.specialCount, 0, this.maxSpecialCount);
        this.reservedSpecialCount = 0;
    }

    applyAtkDebuff(amount) {
        if (this.atkDebuff > amount) {
            this.atkDebuff = amount;
            return true;
        }
        return false;
    }

    applySpdDebuff(amount) {
        if (this.spdDebuff > amount) {
            this.spdDebuff = amount;
            return true;
        }
        return false;
    }

    applyDefDebuff(amount) {
        if (this.defDebuff > amount) {
            this.defDebuff = amount;
            return true;
        }
        return false;
    }

    applyResDebuff(amount) {
        if (this.resDebuff > amount) {
            this.resDebuff = amount;
            return true;
        }
        return false;
    }

    applyDebuffs(atk, spd, def, res) {
        this.applyAtkDebuff(atk);
        this.applySpdDebuff(spd);
        this.applyDefDebuff(def);
        this.applyResDebuff(res);
    }

    modifySpecialCount() {
        this.specialCount = MathUtil.ensureMinMax(this.specialCount, 0, Number(this.maxSpecialCount));
    }

    increaseSpecialCount(amount) {
        this.specialCount = MathUtil.ensureMax(Number(this.specialCount) + amount, Number(this.maxSpecialCount));
    }

    reduceSpecialCount(amount) {
        this.specialCount = MathUtil.ensureMin(Number(this.specialCount) - amount, 0);
    }

    reduceSpecialCountToZero() {
        this.specialCount = 0;
    }

    get currentDamage() {
        return this.maxHpWithSkills - this.hp;
    }

    // TODO: これで全てか確認する
    initReservedState() {
        this.initReservedHp();
        this.initReservedStatusEffects();
        this.initReservedDebuffs();
    }

    initReservedHp() {
        this.reservedDamage = 0;
        this.reservedHeal = 0;
        this.reservedHealNeutralizesDeepWounds = 0;
    }

    initReservedStatusEffects() {
        this.reservedStatusEffects = [];
    }

    initReservedDebuffs() {
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
    }

    getReservedBuffs() {
        return [
            this.reservedAtkBuff,
            this.reservedSpdBuff,
            this.reservedDefBuff,
            this.reservedResBuff
        ];
    }

    getReservedDebuffs() {
        return [
            this.reservedAtkDebuff,
            this.reservedSpdDebuff,
            this.reservedDefDebuff,
            this.reservedResDebuff
        ];
    }

    applyReservedBuffs() {
        this.applyBuffs(...this.getReservedBuffs());
        this.resetReservedBuffs();
    }

    resetReservedBuffs() {
        this.reservedAtkBuff = 0;
        this.reservedSpdBuff = 0;
        this.reservedDefBuff = 0;
        this.reservedResBuff = 0;
    }

    applyReservedDebuffs(isBeginningOfTurn = false) {
        let neutralizedFlags = [false, false, false, false];
        if (isBeginningOfTurn) {
            neutralizedFlags =
                ArrayUtil.or(neutralizedFlags, this.battleContext.neutralizedDebuffFlagsWhileBeginningOfTurn);
            if (this.battleContext.neutralizesAnyPenaltyWhileBeginningOfTurn) {
                neutralizedFlags = [true, true, true, true];
            }
        }
        if (!neutralizedFlags[0]) {
            this.applyAtkDebuff(this.reservedAtkDebuff);
        }
        if (!neutralizedFlags[1]) {
            this.applySpdDebuff(this.reservedSpdDebuff);
        }
        if (!neutralizedFlags[2]) {
            this.applyDefDebuff(this.reservedDefDebuff);
        }
        if (!neutralizedFlags[3]) {
            this.applyResDebuff(this.reservedResDebuff);
        }

        this.resetReservedDebuffs();
    }

    resetReservedDebuffs() {
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
    }

    applyReservedStatusEffects(isBeginningOfTurn = false) {
        let neutralizedStatusEffectSet = new Set();
        if (isBeginningOfTurn) {
            neutralizedStatusEffectSet = this.battleContext.neutralizedStatusEffectSetWhileBeginningOfTurn;
            if (this.battleContext.neutralizesAnyPenaltyWhileBeginningOfTurn) {
                this.reservedStatusEffects.forEach(e => {
                    if (isNegativeStatusEffect(e)) {
                        neutralizedStatusEffectSet.add(e);
                    }
                });
            }
        }
        // 付与予約を反映
        for (let e of this.reservedStatusEffects) {
            // 付与無効
            if (neutralizedStatusEffectSet.has(e)) {
                continue;
            }
            this.addStatusEffect(e);
        }

        // 反映済みの付与予約を解除
        this.reservedStatusEffects = [];
    }

    /**
     * 戦闘中以外の回復
     * @param {Boolean} leavesOneHp
     * @returns {[number, number, number, number]} hp, damage, heal
     */
    applyReservedHp(leavesOneHp) {
        let healHp = this.reservedHeal;
        let reducedHeal = this.hasDeepWounds() ? healHp : 0;
        healHp -= reducedHeal;
        healHp += this.reservedHealNeutralizesDeepWounds;
        let damageHp = this.hasStatusEffect(StatusEffectType.EnGarde) ? 0 : this.reservedDamage;
        this.hp = Number(this.hp) - damageHp + healHp;
        this.modifyHp(leavesOneHp);

        this.reservedDamage = 0;
        this.reservedHeal = 0;
        return [this.hp, damageHp, healHp, reducedHeal];
    }

    calculateReducedHealAmountInCombat(healHp) {
        let reducedHeal = this.hasDeepWounds() ? healHp : 0;
        return this.battleContext.calculateReducedHealAmount(reducedHeal);
    }

    hasDeepWounds() {
        return this.hasStatusEffect(StatusEffectType.DeepWounds) || this.battleContext.hasDeepWounds;
    }

    reserveTakeDamage(damageAmount) {
        this.reservedDamage += damageAmount;
    }

    reserveHeal(healAmount) {
        this.reservedHeal += healAmount;
    }

    reserveHealNeutralizesDeepWounds(healAmount) {
        this.reservedHealNeutralizesDeepWounds += healAmount;
    }

    modifyHp(leavesOneHp = false) {
        this.hp = MathUtil.ensureMinMax(this.hp, leavesOneHp ? 1 : 0, this.maxHpWithSkills);
    }

    takeDamage(damageAmount, leavesOneHp = false) {
        if (this.isDead) {
            return;
        }
        this.hp = MathUtil.ensureMin(this.hp - damageAmount, leavesOneHp ? 1 : 0);
    }

    takeDamageInCombat(damage, leavesOneHp = false) {
        if (this.isDead) {
            return;
        }
        this.restHp = MathUtil.ensureMin(this.restHp - damage, leavesOneHp ? 1 : 0);
    }

    healFull() {
        this.heal(99);
    }

    heal(healAmount) {
        let reducedHeal = this.hasDeepWounds() ? healAmount : 0;
        healAmount -= this.battleContext.calculateReducedHealAmount(reducedHeal);

        let damage = this.maxHpWithSkills - this.hp;
        let hp = this.hp + healAmount;
        if (hp > this.maxHpWithSkills) {
            hp = this.maxHpWithSkills;
        }
        this.hp = hp;
        return Math.min(damage, healAmount);
    }

    healInCombat(healAmount) {
        let reducedHeal = this.hasDeepWounds() ? healAmount : 0;
        healAmount -= this.battleContext.calculateReducedHealAmount(reducedHeal);
        this.restHp = MathUtil.ensureMax(this.restHp + healAmount, this.maxHpWithSkills);
        return [this.restHp, healAmount];
    }

    get isAlive() {
        return this.hp > 0;
    }

    get isDead() {
        return this.hp === 0;
    }

    get serialId() {
        return UnitCookiePrefix + this.id;
    }

    get hasRefreshAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.Refresh;
    }

    get hasHealAssist() {
        if (isRallyHealSkill(this.support)) {
            return false;
        }
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.Heal;
    }

    get hasDonorHealAssist() {
        if (isRallyHealSkill(this.support)) {
            return false;
        }
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.DonorHeal;
    }

    get hasRestoreAssist() {
        if (isRallyHealSkill(this.support)) {
            return false;
        }
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.Restore;
    }

    get hasRallyAssist() {
        if (isRallyHealSkill(this.support)) {
            return true;
        }
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.Rally;
    }

    get hasMoveAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.Move;
    }

    get isWeaponEquipped() {
        return this.weapon !== Weapon.None;
    }

    get isWeaponSpecialRefined() {
        return this.weaponRefinement === WeaponRefinementType.Special
            || this.weaponRefinement === WeaponRefinementType.Special_Hp3;
    }

    get isWeaponRefined() {
        return this.weaponRefinement !== WeaponRefinementType.None;
    }

    get maxDragonflower() {
        if (this.heroInfo == null) {
            return 0;
        }

        return this.heroInfo.maxDragonflower;
    }

    get hpPercentage() {
        if (this.hp >= this.maxHpWithSkills) {
            return 100;
        }
        return Math.round((100 * this.hp / this.maxHpWithSkills) * 100) / 100;
    }

    /**
     * 戦闘のダメージ計算時の残りHPです。戦闘のダメージ計算のみで使用できます。
     */
    get restHpPercentage() {
        if (this.restHp >= this.maxHpWithSkills) {
            return 100;
        }
        return 100 * this.restHp / this.maxHpWithSkills;
    }

    /**
     * ターン開始時スキルで使用する残りのHP割合です。
     */
    get restHpPercentageAtBeginningOfTurn() {
        if (this.hp >= this.maxHpWithSkills) {
            return 100;
        }
        return 100 * this.hp / this.maxHpWithSkills;
    }

    /**
     * 戦闘開始時のHP割合
     */
    get restHpPercentageAtBeginningOfCombat() {
        return this.restHpPercentageAtBeginningOfTurn;
    }

    get isRestHpFull() {
        return this.restHp >= this.maxHpWithSkills;
    }

    get hasPanic() {
        return this.hasStatusEffect(StatusEffectType.Panic);
    }

    get isPanicEnabled() {
        return !this.canNullPanic() && this.hasPanic;
    }

    setDragonflower(value) {
        this.dragonflower = Math.min(value, this.maxDragonflower);
    }

    maximizeMergeAndDragonflower(includeEmblemHeroMerge = false) {
        this.merge = 10;
        this.dragonflower = this.maxDragonflower;
        if (includeEmblemHeroMerge) {
            this.emblemHeroMerge = 10;
        }
        this.updateStatusByMergeAndDragonFlower();
    }

    maximizeDragonflower() {
        this.dragonflower = this.maxDragonflower;
        this.updateStatusByMergeAndDragonFlower();
    }

    maximizeMerge() {
        this.merge = 10;
        this.updateStatusByMergeAndDragonFlower();
    }

    getNormalMoveCount() {
        switch (this.passiveS) {
            case PassiveS.GoeiNoGuzo:
            case PassiveS.TozokuNoGuzoRakurai:
            case PassiveS.TozokuNoGuzoKobu:
            case PassiveS.TozokuNoGuzoKogun:
            case PassiveS.TozokuNoGuzoKusuri:
            case PassiveS.TozokuNoGuzoOugi:
            case PassiveS.TozokuNoGuzoOdori:
                return 1;
        }

        switch (this._moveType) {
            case MoveType.Infantry:
            case MoveType.Flying:
                return 2;
            case MoveType.Armor:
                return 1;
            case MoveType.Cavalry:
                return 3;
            default:
                return 1;
        }
    }

    setMoveCountFromMoveType() {
        this._moveCount = this.getNormalMoveCount();
    }

    get isMovementRestricted() {
        return this.moveCount < this.getNormalMoveCount();
    }

    get isMobilityIncreased() {
        return this.moveCount > this.getNormalMoveCount();
    }

    getNameWithGroup() {
        return this.nameWithGroup;
    }

    get color() {
        return getColorFromWeaponType(this.weaponType);
    }

    get moveCount() {
        if (this.isCantoActivated()) {
            return this.moveCountForCanto;
        }
        if (this.isCannotMoveStyleActive()) {
            return 0;
        }
        if (this.hasStatusEffect(StatusEffectType.Gravity)) {
            return 1;
        }
        if (this.hasStatusEffect(StatusEffectType.Stall)) {
            if (this.hasStatusEffect(StatusEffectType.MobilityIncreased)) {
                return 1;
            }
        }
        if (this.hasStatusEffect(StatusEffectType.Gallop)) {
            return this.getNormalMoveCount() + 2;
        }
        if (this.hasStatusEffect(StatusEffectType.MobilityIncreased)) {
            return this.getNormalMoveCount() + 1;
        }
        return this._moveCount;
    }

    set moveCount(value) {
        this._moveCount = value;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get hp() {
        return this._hp;
    }

    setHpInValidRange(value, leavesOneHp = true) {
        this._hp = value;
        if (this._hp > this.maxHpWithSkills) {
            this._hp = this.maxHpWithSkills;
        }
        if (value <= 0) {
            if (leavesOneHp) {
                this._hp = 1;
            } else {
                this._hp = 0;
            }
        }
    }

    set hp(value) {
        this._hp = value;
    }

    get maxHp() {
        return this._maxHp;
    }

    get isFullHp() {
        return this.hp === this.maxHpWithSkills;
    }

    set maxHp(value) {
        this._maxHp = value;
    }

    get atk() {
        return this._atk;
    }

    set atk(value) {
        this._atk = value;
    }

    get spd() {
        return this._spd;
    }

    set spd(value) {
        this._spd = value;
    }

    get def() {
        return this._def;
    }

    set def(value) {
        this._def = value;
    }

    get res() {
        return this._res;
    }

    set res(value) {
        this._res = value;
    }

    get dragonflowerIcon() {
        let root = g_siteRootPath + "blog/images/feh/";
        switch (this.moveType) {
            case MoveType.Infantry:
                return root + "Dragonflower_Infantry.png";
            case MoveType.Flying:
                return root + "Dragonflower_Flying.png";
            case MoveType.Cavalry:
                return root + "Dragonflower_Cavalry.png";
            case MoveType.Armor:
                return root + "Dragonflower_Armored.png";
            default:
                return g_siteRootPath + "images/dummy.png";
        }
    }

    get icon() {
        if (this.heroInfo == null) {
            return g_siteRootPath + "images/dummy.png";
        }
        return this.heroInfo.iconUrl;
    }

    /**
     * @returns {Number}
     */
    get attackRange() {
        if (this.isCantoActivated()) {
            return 0;
        }

        if (this.weapon === Weapon.None) {
            return 0;
        }
        return getAttackRangeOfWeaponType(this.weaponType);
    }

    get enemyGroupId() {
        return this.groupId !== UnitGroupType.Ally ? UnitGroupType.Ally : UnitGroupType.Enemy;
    }

    get groupId() {
        return this._groupId;
    }

    get moveType() {
        return this._moveType;
    }

    set moveType(value) {
        this._moveType = value;
    }

    /**
     * @returns {Tile}
     */
    get placedTile() {
        return this._placedTile;
    }

    /**
     * @param  {Tile} value
     */
    set placedTile(value) {
        this._placedTile = value;
    }

    applyAtkUnity() {
        let targetUnit = this;
        targetUnit.atkSpur += 5;
        let debuff = targetUnit.atkDebuffTotal;
        if (debuff < 0) {
            targetUnit.atkSpur += -debuff * 2;
        }
    }

    applySpdUnity() {
        let targetUnit = this;
        targetUnit.spdSpur += 5;
        let debuff = targetUnit.spdDebuffTotal;
        if (debuff < 0) {
            targetUnit.spdSpur += -debuff * 2;
        }
    }

    applyDefUnity() {
        let targetUnit = this;
        targetUnit.defSpur += 5;
        let debuff = targetUnit.defDebuffTotal;
        if (debuff < 0) {
            targetUnit.defSpur += -debuff * 2;
        }
    }

    applyResUnity() {
        let targetUnit = this;
        targetUnit.resSpur += 5;
        let debuff = targetUnit.resDebuffTotal;
        if (debuff < 0) {
            targetUnit.resSpur += -debuff * 2;
        }
    }

    /// 装備中の武器名を取得します。
    // noinspection JSUnusedGlobalSymbols
    getWeaponName() {
        return this.weaponInfo == null ? "‐" : this.weaponInfo.name;
    }

    /// 装備中のAスキル名を取得します。
    // noinspection JSUnusedGlobalSymbols
    getPassiveAName() {
        return this.passiveAInfo == null ? "‐" : this.passiveAInfo.name;
    }

    /// 装備中の聖印名を取得します。
    // noinspection JSUnusedGlobalSymbols
    getPassiveSName() {
        return this.passiveSInfo == null ? "‐" : this.passiveSInfo.name;
    }

    /// 装備中の聖印名を取得します。
    // noinspection JSUnusedGlobalSymbols
    getPassiveXName() {
        return this.passiveXInfo == null ? "‐" : this.passiveXInfo.name;
    }

    getVisibleStatusTotal() {
        return this.getAtkInPrecombat()
            + this.getSpdInPrecombat()
            + this.getDefInPrecombat()
            + this.getResInPrecombat();
    }

    setPos(x, y) {
        this.fromPosX = this.posX;
        this.fromPosY = this.posY;
        this.posX = x;
        this.posY = y;
    }

    setFromPos(x, y) {
        this.fromPosX = x;
        this.fromPosY = y;
    }

    fromPosStr() {
        return `(${this.fromPosX}, ${this.fromPosY})`;
    }

    setStartTile(tile = null) {
        this._startTile = tile ? tile : this.placedTile;
    }

    getStartTile() {
        return this._startTile;
    }

    resetStartTile() {
        this.startTile = null;
    }

    getStartX() {
        return this._startTile ? this._startTile.posX : this.posX;
    }

    getStartY() {
        return this._startTile ? this._startTile.posY : this.posY;
    }

    moveDistance() {
        return this._startTile ? this._startTile.calculateDistanceTo(this.placedTile.posX, this.placedTile.posY) : 0;
    }

    getLocationStr(tileToAttack = null) {
        let atkInfo = '';
        if (tileToAttack) {
            atkInfo = ` 攻撃マス: ${tileToAttack}`;
        }
        return `${this.nameWithGroup}: ${this.fromPosStr()} => ${this.placedTile}${atkInfo}`;
    }

    getTriangleAdeptAdditionalRatio() {
        if (this.passiveA === PassiveA.Duality) {
            return 0;
        }
        if (isTriangleAdeptSkill(this.passiveA)
            || isTriangleAdeptSkill(this.weapon)
            || (this.weapon === Weapon.Forukuvangu && this.isWeaponSpecialRefined)
            || (this.weapon === Weapon.TomeOfOrder && this.isWeaponSpecialRefined)
            || (this.weapon === Weapon.SeireiNoHogu && this.isWeaponSpecialRefined && this.battleContext.restHpPercentage >= 25)
            || this.hasStatusEffect(StatusEffectType.TriangleAdept)
        ) {
            return 0.2;
        } else if (this.passiveA === PassiveA.AishoGekika2) {
            return 0.15;
        } else if (this.passiveA === PassiveA.AishoGekika1) {
            return 0.1;
        }
        return 0;
    }

    // 「自分のスキルによる3すくみ激化を無効化」
    neutralizesSelfTriangleAdvantage() {
        // @TODO: 相性相殺1,2も同様
        return this.hasPassiveSkill(PassiveB.AisyoSosatsu3) || this.hasStatusEffect(StatusEffectType.CancelAffinity);
    }

    // 「相性不利の時、敵スキルによる3すくみ激化を反転」
    reversesTriangleAdvantage() {
        // @TODO: 相性相殺1,2は反転しない
        return this.hasPassiveSkill(PassiveB.AisyoSosatsu3) || this.hasStatusEffect(StatusEffectType.CancelAffinity);
    }

    __getBuffMultiply() {
        let isPanic = this.hasPanic && !this.canNullPanic();
        return isPanic ? -1 : 1;
    }

    canNullPanic() {
        return this.hasStatusEffect(StatusEffectType.NullPanic);
    }

    resetGreatTalents() {
        this._greatTalents = [0, 0, 0, 0];
    }

    forceResetGreatTalents() {
        this._greatTalents = [0, 0, 0, 0];
    }

    /**
     * @param {number} index
     */
    getGreatTalent(index) {
        return this._greatTalents[index];
    }

    /**
     * NOTE: Returns copy.
     * @returns {[number, number, number, number]}
     */
    getGreatTalents() {
        return [...this._greatTalents];
    }

    /**
     * @param {number} index
     * @param {number} value
     * @param {number} maxValue
     */
    setGreatTalent(index, value, maxValue = 99) {
        this._greatTalents[index] = MathUtil.ensureMax(value, maxValue);
    }

    /**
     * @param {[number, number, number, number]} values
     * @param {[number, number, number, number]} maxValues
     */
    setGreatTalentsFrom(values, maxValues = [99, 99, 99, 99]) {
        this._greatTalents = ArrayUtil.apply(values, maxValues, MathUtil.ensureMax);
    }

    getReservedGreatTalents() {
        return [...this._reservedGreatTalents];
    }

    getReservedMaxGreatTalents() {
        return [...this._reservedMaxGreatTalents];
    }

    reserveToAddGreatTalentsFrom(values, maxValues) {
        let addableValues = this.getAddableGreatTalents(values, maxValues);
        this.addReservedGreatTalents(addableValues);
        this.calculateMaxReservedGreatTalents(maxValues);
    }

    getAddableGreatTalents(values, maxValues) {
        let subbed = ArrayUtil.sub(maxValues, this.getGreatTalents()).map(v => MathUtil.ensureMin(v, 0));
        return ArrayUtil.min(values, subbed);
    }

    addReservedGreatTalents(values) {
        this._reservedGreatTalents = ArrayUtil.add(this.getReservedGreatTalents(), values);
    }

    calculateMaxReservedGreatTalents(maxValues) {
        this._reservedMaxGreatTalents = ArrayUtil.max(this.getReservedMaxGreatTalents(), maxValues);
    }

    applyReservedGreatTalents() {
        // 今の値を保存
        let currentValues = this.getGreatTalents();
        // 上限を気にせず加算する
        let addedValues = ArrayUtil.add(this.getGreatTalents(), this.getReservedGreatTalents());
        // 予約された最大値を適用(最大値とのmin)
        let minValues = ArrayUtil.min(addedValues, this.getReservedMaxGreatTalents());
        // 適用したものとcurrentのmaxを選択(現在より減ることはない)
        this.setGreatTalentsFrom(ArrayUtil.max(currentValues, minValues));
        // 値をクリア
        this.clearReservedGreatTalents();
    }

    applyReservedGranting(isBeginningOfTurn) {
        this.applyReservedBuffs();
        this.applyReservedDebuffs(isBeginningOfTurn);
        this.applyReservedStatusEffects(isBeginningOfTurn);
        this.applyReservedGreatTalents();
    }

    // TODO: 直接付与している箇所を予約に置き換える
    applyReservedState(isBeginningOfTurn) {
        // 解除
        this.neutralizeReservedStateToNeutralize();

        // 付与
        this.applyReservedGranting(isBeginningOfTurn);

        // 奥義カウント
        this.applyReservedSpecialCount();
    }

    clearReservedGreatTalents() {
        this._reservedGreatTalents = [0, 0, 0 ,0];
        this._reservedMaxGreatTalents = [0, 0, 0, 0];
    }

    getStatusesWithSkills() {
        return [
            this.atkWithSkills,
            this.spdWithSkills,
            this.defWithSkills,
            this.resWithSkills
        ];
    }

    getSpdInPrecombatWithoutDebuff() {
        return Number(this.spdWithSkills) + Number(this.spdBuff) * this.__getBuffMultiply() + this.getGreatTalent(STATUS_INDEX.Spd);
    }

    getSpdInPrecombat() {
        return Math.min(99, this.getSpdInPrecombatWithoutDebuff() + Number(this.spdDebuff));
    }

    getEvalAtkInCombat(enemyUnit = null) {
        return this.getAtkInCombat(enemyUnit) + this.__getEvalAtkAdd();
    }

    getEvalSpdInCombat(enemyUnit = null) {
        return this.getSpdInCombat(enemyUnit) + this.__getEvalSpdAdd();
    }

    getEvalSpdInPrecombat() {
        return this.getSpdInPrecombat() + this.__getEvalSpdAdd();
    }

    __getEvalAtkAdd() {
        return 0;
    }

    __getEvalSpdAdd() {
        return getEvalSpdAdd(this);
    }

    getAtkInPrecombatWithoutDebuff() {
        return Number(this.atkWithSkills) + Number(this.atkBuff) * this.__getBuffMultiply() + this.getGreatTalent(STATUS_INDEX.Atk);
    }

    getAtkInPrecombat() {
        return Math.min(99, this.getAtkInPrecombatWithoutDebuff() + Number(this.atkDebuff));
    }

    getStatusesInPrecombat() {
        return [
            this.getAtkInPrecombat(),
            this.getSpdInPrecombat(),
            this.getDefInPrecombat(),
            this.getResInPrecombat()
        ];
    }

    getEvalStatusesInPrecombat(includesHp = false) {
        let stats = [
            this.getEvalAtkInPrecombat(),
            this.getEvalSpdInPrecombat(),
            this.getEvalDefInPrecombat(),
            this.getEvalResInPrecombat()
        ];
        return includesHp ? [this.hp, ...stats] : stats;
    }

    // 強化無効の場合0。パニックの場合マイナス。強化無効かつパニックの場合マイナス。
    __getBuffInCombat(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
        let buffMult = this.__getBuffMultiply();
        let buff = 0;
        if (getInvalidatesFunc()) {
            if (buffMult < 0) {
                buff = getBuffFunc() * buffMult;
            }
        } else {
            buff = getBuffFunc() * buffMult;
        }

        if (buff < 0 && getInvalidateOwnDebuffFunc()) {
            return 0;
        }

        return buff;
    }

    getAtkBuffInCombat(enemyUnit) {
        let invalidates =
            enemyUnit !== null &&
            enemyUnit.battleContext.invalidatesAtkBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
        return this.__getBuffInCombat(
            () => invalidates,
            () => Number(this.atkBuff),
            () => this.battleContext.invalidatesOwnAtkDebuff
        );
    }

    getSpdBuffInCombat(enemyUnit) {
        let invalidates = enemyUnit !== null &&
            enemyUnit.battleContext.invalidatesSpdBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : invalidates,
            () => Number(this.spdBuff),
            () => this.battleContext.invalidatesOwnSpdDebuff
        );
    }

    getResBuffInCombat(enemyUnit) {
        let invalidates = enemyUnit !== null &&
            enemyUnit.battleContext.invalidatesResBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : invalidates,
            () => Number(this.resBuff),
            () => this.battleContext.invalidatesOwnResDebuff
        );
    }

    getDefBuffInCombat(enemyUnit) {
        let invalidates = enemyUnit !== null &&
            enemyUnit.battleContext.invalidatesDefBuff ||
            enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat);
        return this.__getBuffInCombat(
            () => enemyUnit == null ? false : invalidates,
            () => Number(this.defBuff),
            () => this.battleContext.invalidatesOwnDefDebuff
        );
    }

    /**
     * @returns {[number, number, number, number]}
     */
    getBuffsInPreCombat() {
        return [
            this.atkBuff * this.__getBuffMultiply(),
            this.spdBuff * this.__getBuffMultiply(),
            this.defBuff * this.__getBuffMultiply(),
            this.resBuff * this.__getBuffMultiply(),
        ];
    }

    /**
     * @returns {[number, number, number, number]}
     */
    getBuffsInCombat(enemyUnit) {
        return [
            this.getAtkBuffInCombat(enemyUnit),
            this.getSpdBuffInCombat(enemyUnit),
            this.getDefBuffInCombat(enemyUnit),
            this.getResBuffInCombat(enemyUnit),
        ];
    }

    // 自分のBuffと相手のDebuff
    getBuffsEnemyDebuffsInCombat(enemyUnit) {
        return [
            [this.getAtkBuffInCombat(enemyUnit), enemyUnit.getAtkDebuffInCombat()],
            [this.getSpdBuffInCombat(enemyUnit), enemyUnit.getSpdDebuffInCombat()],
            [this.getDefBuffInCombat(enemyUnit), enemyUnit.getDefDebuffInCombat()],
            [this.getResBuffInCombat(enemyUnit), enemyUnit.getResDebuffInCombat()],
        ]
    }

    __getStatusInCombat(getInvalidatesFunc, getStatusWithoutBuffFunc, getBuffFunc, getInvalidateOwnDebuffFunc) {
        let statusWithoutBuff = getStatusWithoutBuffFunc();
        let buff = this.__getBuffInCombat(getInvalidatesFunc, getBuffFunc, getInvalidateOwnDebuffFunc);
        return statusWithoutBuff + buff;
    }

    /**
     * @param {Unit} enemyUnit
     * @returns {number[]}
     */
    getStatusesInCombat(enemyUnit = null) {
        return [
            this.getAtkInCombat(enemyUnit),
            this.getSpdInCombat(enemyUnit),
            this.getDefInCombat(enemyUnit),
            this.getResInCombat(enemyUnit),
        ].map(value => MathUtil.ensureMin(value, 0));
    }

    /**
     * @param {Unit} enemyUnit
     * @returns {number[]}
     */
    getEvalStatusesInCombat(enemyUnit = null) {
        return [
            this.getEvalAtkInCombat(enemyUnit),
            this.getEvalSpdInCombat(enemyUnit),
            this.getEvalDefInCombat(enemyUnit),
            this.getEvalResInCombat(enemyUnit),
        ];
    }

    /**
     * 最も高いステータスを取得
     * @param {Unit} enemyUnit
     * @param {boolean[]} statusFlags (ex) 最も高いステータス: [true, true, true, true], 守備と魔防の高い方: [false, false, true, true]
     */
    getHighestStatusInCombat(enemyUnit = null, statusFlags) {
        let statuses = this.getStatusesInCombat(enemyUnit);
        return Math.max(...statuses.map((s, i) => statusFlags[i] ? s : 0));
    }

    getAtkInCombat(enemyUnit = null) {
        let invalidates = enemyUnit !== null &&
            (enemyUnit.battleContext.invalidatesAtkBuff ||
                enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
        return this.__getStatusInCombat(
            () => invalidates,
            () => this.__getAtkInCombatWithoutBuff(),
            () => Number(this.atkBuff),
            () => this.battleContext.invalidatesOwnAtkDebuff
        );
    }

    getSpdInCombat(enemyUnit = null) {
        let invalidates = enemyUnit !== null &&
            (enemyUnit.battleContext.invalidatesSpdBuff ||
                enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
        return this.__getStatusInCombat(
            () => invalidates,
            () => this.__getSpdInCombatWithoutBuff(),
            () => Number(this.spdBuff),
            () => this.battleContext.invalidatesOwnSpdDebuff
        );
    }

    getDefInCombat(enemyUnit = null) {
        let invalidates = enemyUnit !== null &&
            (enemyUnit.battleContext.invalidatesDefBuff ||
                enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
        return this.__getStatusInCombat(
            () => invalidates,
            () => this.__getDefInCombatWithoutBuff(),
            () => Number(this.defBuff),
            () => this.battleContext.invalidatesOwnDefDebuff
        );
    }

    getResInCombat(enemyUnit = null) {
        let invalidates = enemyUnit !== null &&
            (enemyUnit.battleContext.invalidatesResBuff ||
                enemyUnit.hasStatusEffect(StatusEffectType.NeutralizesFoesBonusesDuringCombat));
        return this.__getStatusInCombat(
            () => invalidates,
            () => this.__getResInCombatWithoutBuff(),
            () => Number(this.resBuff),
            () => this.battleContext.invalidatesOwnResDebuff
        );
    }

    // マイナス値を返す
    getAtkDebuffInCombat() {
        return this.battleContext.invalidatesOwnAtkDebuff ? 0 : Number(this.atkDebuff);
    }

    getSpdDebuffInCombat() {
        return this.battleContext.invalidatesOwnSpdDebuff ? 0 : Number(this.spdDebuff);
    }

    getDefDebuffInCombat() {
        return this.battleContext.invalidatesOwnDefDebuff ? 0 : Number(this.defDebuff);
    }

    getResDebuffInCombat() {
        return this.battleContext.invalidatesOwnResDebuff ? 0 : Number(this.resDebuff);
    }

    __getAtkInCombatWithoutBuff() {
        return Number(this.atkWithSkills) + this.getAtkDebuffInCombat() + Number(this.atkSpur) + this.getGreatTalent(STATUS_INDEX.Atk);
    }

    __getSpdInCombatWithoutBuff() {
        return Number(this.spdWithSkills) + this.getSpdDebuffInCombat() + Number(this.spdSpur) + this.getGreatTalent(STATUS_INDEX.Spd);
    }

    __getDefInCombatWithoutBuff() {
        return Number(this.defWithSkills) + this.getDefDebuffInCombat() + Number(this.defSpur) + this.getGreatTalent(STATUS_INDEX.Def);
    }

    __getResInCombatWithoutBuff() {
        return Number(this.resWithSkills) + this.getResDebuffInCombat() + Number(this.resSpur) + this.getGreatTalent(STATUS_INDEX.Res);
    }

    getEvalAtkInPrecombat() {
        return this.getAtkInPrecombat() + this.__getEvalAtkAdd();
    }

    getEvalDefInPrecombat() {
        return this.getDefInPrecombat() + this.__getEvalDefAdd();
    }

    getEvalDefInCombat(enemyUnit = null) {
        return this.getDefInCombat(enemyUnit) + this.__getEvalDefAdd();
    }

    getDefInPrecombatWithoutDebuff() {
        let mit = Number(this.defWithSkills);
        let mitBuff = Number(this.defBuff) * this.__getBuffMultiply();
        return mit + mitBuff + this.getGreatTalent(STATUS_INDEX.Def);
    }

    getDefInPrecombat() {
        return Math.min(99, this.getDefInPrecombatWithoutDebuff() + Number(this.defDebuff));
    }

    getDefDiffInCombat(enemyUnit) {
        return this.getDefInCombat(enemyUnit) - enemyUnit.getDefInCombat(this);
    }

    getResInPrecombatWithoutDebuff() {
        let mit = Number(this.resWithSkills);
        let mitBuff = Number(this.resBuff) * this.__getBuffMultiply();
        return mit + mitBuff + this.getGreatTalent(STATUS_INDEX.Res);
    }

    getResInPrecombat() {
        return Math.min(99, this.getResInPrecombatWithoutDebuff() + Number(this.resDebuff));
    }

    getEvalResInCombat(enemyUnit = null) {
        return this.getResInCombat(enemyUnit) + this.__getEvalResAdd();
    }

    getEvalResInPrecombat() {
        return this.getResInPrecombat() + this.__getEvalResAdd();
    }

    getEvalResDiffInCombat(enemyUnit) {
        return this.getEvalResInCombat(enemyUnit) - enemyUnit.getEvalResInCombat(this);
    }

    getEvalResDiffInPrecombat(enemyUnit) {
        return this.getEvalResInPrecombat() - enemyUnit.getEvalResInPrecombat();
    }

    /**
     * 攻撃が相手の攻撃+n以上かどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherOrEqualAtkInCombat(enemyUnit, n = 0) {
        return this.getEvalAtkInCombat(enemyUnit) >= enemyUnit.getEvalAtkInCombat(this) + n;
    }

    /**
     * 守備が「相手の守備+n」以下かどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isLowerOrEqualDefInPrecombat(enemyUnit, n = 0) {
        return this.statusEvalUnit.getEvalDefInPrecombat() <= enemyUnit.statusEvalUnit.getEvalDefInPrecombat() + n;
    }

    /**
     * 守備が相手の守備+n以下かどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isLowerOrEqualDefInCombat(enemyUnit, n = 0) {
        return this.getEvalDefInCombat(enemyUnit) <= enemyUnit.getEvalDefInCombat(this) + n;
    }

    /**
     * 攻撃が相手の攻撃+n以上かどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherOrEqualAtkInPrecombat(enemyUnit, n = 0) {
        return this.statusEvalUnit.getEvalAtkInPrecombat() >= enemyUnit.statusEvalUnit.getEvalAtkInPrecombat() + n;
    }

    /**
     * 守備が相手の守備+nより高いかどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherDefInPrecombat(enemyUnit, n = 0) {
        return this.isHigherOrEqualDefInPrecombat(enemyUnit, n + 1);
    }

    /**
     * 守備が相手の守備+n以上かどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherOrEqualDefInPrecombat(enemyUnit, n = 0) {
        return this.statusEvalUnit.getEvalDefInPrecombat() >= enemyUnit.statusEvalUnit.getEvalDefInPrecombat() + n;
    }

    /**
     * 魔防が相手の魔防+nより高いかどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherResInPrecombat(enemyUnit, n = 0) {
        return this.isHigherOrEqualResInPrecombat(enemyUnit, n + 1);
    }

    /**
     * 魔防が相手の魔防+n以上かを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherOrEqualResInPrecombat(enemyUnit, n = 0) {
        return this.statusEvalUnit.getEvalResInPrecombat() >= enemyUnit.statusEvalUnit.getEvalResInPrecombat() + n;
    }

    /**
     * 魔防が「相手の魔防+n」より低いかどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isLowerResInPrecombat(enemyUnit, n = 0) {
        return this.statusEvalUnit.getEvalResInPrecombat() < enemyUnit.statusEvalUnit.getEvalResInPrecombat() + n;
    }

    /**
     * 魔防が相手の魔防+nより高いかどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherResInCombat(enemyUnit, n = 0) {
        return this.getEvalResInCombat(enemyUnit) > enemyUnit.getEvalResInCombat(this) + n;
    }

    /**
     * 速さが相手の速さ+nより高いかどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherSpdInCombat(enemyUnit, n = 0) {
        return this.isHigherOrEqualSpdInCombat(enemyUnit, n + 1);
    }

    /**
     * 速さが相手の速さ+n以上かどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherOrEqualSpdInCombat(enemyUnit, n = 0) {
        return this.getEvalSpdInCombat(enemyUnit) >= enemyUnit.getEvalSpdInCombat(this) + n;
    }

    /**
     * 魔防が相手の魔防+n以上かどうかを返す
     * @param {Unit} enemyUnit
     * @param {number} n
     * @return {boolean}
     */
    isHigherOrEqualResInCombat(enemyUnit, n = 0) {
        return this.getEvalResInCombat(enemyUnit) >= enemyUnit.getEvalResInCombat(this) + n;
    }

    __getEvalDefAdd() {
        switch (this.passiveS) {
            default:
                return 0;
        }
    }

    __getEvalResAdd() {
        let value = getEvalResAdd(this);
        if (value) {
            return value;
        }
        return 0;
    }

    // TODO: 削除する
    hasSkill(skillId) {
        return this.weapon === skillId
            || this.support === skillId
            || this.special === skillId
            || this.passiveA === skillId
            || this.passiveB === skillId
            || this.passiveC === skillId
            || this.passiveS === skillId
            || this.passiveX === skillId;
    }

    hasPassiveSkill(skillId) {
        return this.passiveA === skillId
            || this.passiveB === skillId
            || this.passiveC === skillId
            || this.passiveS === skillId
            || this.passiveX === skillId;
    }

    isPhysicalAttacker() {
        return isPhysicalWeaponType(this.weaponType);
    }

    updateStatusByWeaponRefinement() {
        switch (this.weaponRefinement) {
            case WeaponRefinementType.None:
                break;
            case WeaponRefinementType.Special_Hp3:
                this._maxHpWithSkills += 3;
                break;
            case WeaponRefinementType.Hp5_Atk2:
                this._maxHpWithSkills += 5;
                this.atkWithSkills += 2;
                break;
            case WeaponRefinementType.Hp5_Spd3:
                this._maxHpWithSkills += 5;
                this.spdWithSkills += 3;
                break;
            case WeaponRefinementType.Hp5_Def4:
                this._maxHpWithSkills += 5;
                this.defWithSkills += 4;
                break;
            case WeaponRefinementType.Hp5_Res4:
                this._maxHpWithSkills += 5;
                this.resWithSkills += 4;
                break;
            case WeaponRefinementType.Hp2_Atk1:
                this._maxHpWithSkills += 2;
                this.atkWithSkills += 1;
                break;
            case WeaponRefinementType.Hp2_Spd2:
                this._maxHpWithSkills += 2;
                this.spdWithSkills += 2;
                break;
            case WeaponRefinementType.Hp2_Def3:
                this._maxHpWithSkills += 2;
                this.defWithSkills += 3;
                break;
            case WeaponRefinementType.Hp2_Res3:
                this._maxHpWithSkills += 2;
                this.resWithSkills += 3;
                break;
            default:
                break;
        }
    }

    updateStatusBySummonerLevel() {
        switch (this.summonerLevel) {
            case SummonerLevel.None:
                break;
            case SummonerLevel.S:
                this._maxHpWithSkills += 5;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                this.spdWithSkills += 2;
                this.atkWithSkills += 2;
                break;
            case SummonerLevel.A:
                this._maxHpWithSkills += 4;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                this.spdWithSkills += 2;
                break;
            case SummonerLevel.B:
                this._maxHpWithSkills += 4;
                this.defWithSkills += 2;
                this.resWithSkills += 2;
                break;
            case SummonerLevel.C:
                this._maxHpWithSkills += 3;
                this.resWithSkills += 2;
                break;
            default:
                break;
        }
    }

    updateStatusByBlessing(syncBlessingEffects = true) {
        if (syncBlessingEffects) {
            this.__syncBlessingEffects();
        }
        this.__updateStatusByBlessing(this.blessing1);
        this.__updateStatusByBlessing(this.blessing2);
        this.__updateStatusByBlessing(this.blessing3);
        this.__updateStatusByBlessing(this.blessing4);
        this.__updateStatusByBlessing(this.blessing5);
        this.__updateStatusByBlessing(this.blessing6);
    }

    __updateStatusByBlessing(blessing) {
        switch (blessing) {
            case BlessingType.Hp5_Atk3:
                this.addHpAfterEnteringBattle(5);
                this.atkWithSkills += 3;
                break;
            case BlessingType.Hp5_Spd4:
                this.addHpAfterEnteringBattle(5);
                this.spdWithSkills += 4;
                break;
            case BlessingType.Hp5_Def5:
                this.addHpAfterEnteringBattle(5);
                this.defWithSkills += 5;
                break;
            case BlessingType.Hp5_Res5:
                this.addHpAfterEnteringBattle(5);
                this.resWithSkills += 5;
                break;
            case BlessingType.Hp3_Atk2:
                this.addHpAfterEnteringBattle(3);
                this.atkWithSkills += 2;
                break;
            case BlessingType.Hp3_Spd3:
                this.addHpAfterEnteringBattle(3);
                this.spdWithSkills += 3;
                break;
            case BlessingType.Hp3_Def4:
                this.addHpAfterEnteringBattle(3);
                this.defWithSkills += 4;
                break;
            case BlessingType.Hp3_Res4:
                this.addHpAfterEnteringBattle(3);
                this.resWithSkills += 4;
                break;
            case BlessingType.Hp3:
                this.addHpAfterEnteringBattle(3);
                break;
            default:
                break;
        }
    }

    setIvHighStat(value, updatesPureGrowthRate = true) {
        if (this.ivHighStat === value) {
            return;
        }
        this.ivHighStat = value;
        this.updateBaseStatus(updatesPureGrowthRate);
    }

    setIvLowStat(value, updatesPureGrowthRate = true) {
        if (this.ivLowStat === value) {
            return;
        }
        this.ivLowStat = value;
        this.updateBaseStatus(updatesPureGrowthRate);
    }

    updateBaseStatus(updatesPureGrowthRate = true) {
        if (this.heroInfo == null) {
            throw new Error("heroInfo must not be null.");
        }

        let hpLv1IvChange = 0;
        let atkLv1IvChange = 0;
        let spdLv1IvChange = 0;
        let defLv1IvChange = 0;
        let resLv1IvChange = 0;
        switch (this.ivHighStat) {
            case StatusType.None:
                break;
            case StatusType.Hp:
                hpLv1IvChange = 1;
                break;
            case StatusType.Atk:
                atkLv1IvChange = 1;
                break;
            case StatusType.Spd:
                spdLv1IvChange = 1;
                break;
            case StatusType.Def:
                defLv1IvChange = 1;
                break;
            case StatusType.Res:
                resLv1IvChange = 1;
                break;
        }

        switch (this.ascendedAsset) {
            case StatusType.None:
                break;
            case StatusType.Hp:
                hpLv1IvChange = 1;
                break;
            case StatusType.Atk:
                atkLv1IvChange = 1;
                break;
            case StatusType.Spd:
                spdLv1IvChange = 1;
                break;
            case StatusType.Def:
                defLv1IvChange = 1;
                break;
            case StatusType.Res:
                resLv1IvChange = 1;
                break;
        }

        if (this.merge === 0) {
            switch (this.ivLowStat) {
                case StatusType.None:
                    break;
                case StatusType.Hp:
                    hpLv1IvChange = -1;
                    break;
                case StatusType.Atk:
                    atkLv1IvChange = -1;
                    break;
                case StatusType.Spd:
                    spdLv1IvChange = -1;
                    break;
                case StatusType.Def:
                    defLv1IvChange = -1;
                    break;
                case StatusType.Res:
                    resLv1IvChange = -1;
                    break;
            }
        }

        let rarity = Number(this.rarity);
        this.hpLv1 = this.heroInfo.getHpLv1(rarity) + hpLv1IvChange;
        this.atkLv1 = this.heroInfo.getAtkLv1(rarity) + atkLv1IvChange;
        this.spdLv1 = this.heroInfo.getSpdLv1(rarity) + spdLv1IvChange;
        this.defLv1 = this.heroInfo.getDefLv1(rarity) + defLv1IvChange;
        this.resLv1 = this.heroInfo.getResLv1(rarity) + resLv1IvChange;

        if (updatesPureGrowthRate) {
            this.updatePureGrowthRate();
        }

        this.hpAppliedGrowthRate = this.__calcAppliedGrowthRate(this.hpGrowthRate);
        this.atkAppliedGrowthRate = this.__calcAppliedGrowthRate(this.atkGrowthRate);
        this.spdAppliedGrowthRate = this.__calcAppliedGrowthRate(this.spdGrowthRate);
        this.defAppliedGrowthRate = this.__calcAppliedGrowthRate(this.defGrowthRate);
        this.resAppliedGrowthRate = this.__calcAppliedGrowthRate(this.resGrowthRate);

        this.hpLvN = this.hpLv1 + this.__calcGrowthValue(this.hpGrowthRate);
        this.atkLvN = this.atkLv1 + this.__calcGrowthValue(this.atkGrowthRate);
        this.spdLvN = this.spdLv1 + this.__calcGrowthValue(this.spdGrowthRate);
        this.defLvN = this.defLv1 + this.__calcGrowthValue(this.defGrowthRate);
        this.resLvN = this.resLv1 + this.__calcGrowthValue(this.resGrowthRate);
    }

    __calcStatusLvN(standardValueLv1, standardValueLv40, ivType) {
        let growthValue = standardValueLv40 - standardValueLv1;
        let valueLv1 = standardValueLv1;
        let growthRate = getGrowthRateOfStar5(growthValue);
        switch (ivType) {
            case IvType.Asset:
                valueLv1 += 1;
                growthRate += 0.05;
                break;
            case IvType.Flaw:
                if (this.merge === 0) {
                    valueLv1 -= 1;
                    growthRate -= 0.05;
                }
                break;
            case IvType.None:
                break;
        }
        return valueLv1 + this.__calcGrowthValue(growthRate);
    }

    updatePureGrowthRate() {
        this.hpGrowthRate = this.heroInfo.hpGrowthRate;
        this.atkGrowthRate = this.heroInfo.atkGrowthRate;
        this.spdGrowthRate = this.heroInfo.spdGrowthRate;
        this.defGrowthRate = this.heroInfo.defGrowthRate;
        this.resGrowthRate = this.heroInfo.resGrowthRate;

        switch (this.ivHighStat) {
            case StatusType.None:
                break;
            case StatusType.Hp:
                this.hpGrowthRate += 0.05;
                break;
            case StatusType.Atk:
                this.atkGrowthRate += 0.05;
                break;
            case StatusType.Spd:
                this.spdGrowthRate += 0.05;
                break;
            case StatusType.Def:
                this.defGrowthRate += 0.05;
                break;
            case StatusType.Res:
                this.resGrowthRate += 0.05;
                break;
        }

        {
            switch (this.ascendedAsset) {
                case StatusType.None:
                    break;
                case StatusType.Hp:
                    this.hpGrowthRate += 0.05;
                    break;
                case StatusType.Atk:
                    this.atkGrowthRate += 0.05;
                    break;
                case StatusType.Spd:
                    this.spdGrowthRate += 0.05;
                    break;
                case StatusType.Def:
                    this.defGrowthRate += 0.05;
                    break;
                case StatusType.Res:
                    this.resGrowthRate += 0.05;
                    break;
            }
        }

        if (this.merge === 0) {
            switch (this.ivLowStat) {
                case StatusType.None:
                    break;
                case StatusType.Hp:
                    this.hpGrowthRate -= 0.05;
                    break;
                case StatusType.Atk:
                    this.atkGrowthRate -= 0.05;
                    break;
                case StatusType.Spd:
                    this.spdGrowthRate -= 0.05;
                    break;
                case StatusType.Def:
                    this.defGrowthRate -= 0.05;
                    break;
                case StatusType.Res:
                    this.resGrowthRate -= 0.05;
                    break;
            }
        }
    }

    /// 入力した成長率に対して、得意ステータスの上昇値を取得します。
    // noinspection JSUnusedGlobalSymbols
    calcAssetStatusIncrement(growthRate) {
        return this.__calcGrowthValue(growthRate + 0.05) - this.__calcGrowthValue(growthRate) + 1;
    }

    /// 入力した成長率に対して、不得意ステータスの減少値を取得します。
    // noinspection JSUnusedGlobalSymbols
    calcFlowStatusDecrement(growthRate) {
        return this.__calcGrowthValue(growthRate - 0.05) - this.__calcGrowthValue(growthRate) - 1;
    }

    updateStatusByMergeAndDragonFlower() {
        // 増援のステータス上昇
        const addValues = Unit.calcStatusAddValuesByMergeAndDragonFlower(
            this.ivHighStat, this.ivLowStat, this.ascendedAsset,
            this.merge, this.dragonflower, this.emblemHeroMerge,
            this.reinforcementMerge,
            this.heroInfo.hpLv1,
            this.heroInfo.atkLv1,
            this.heroInfo.spdLv1,
            this.heroInfo.defLv1,
            this.heroInfo.resLv1
        );

        this._maxHpWithSkills += addValues[0];
        this.atkWithSkills += addValues[1];
        this.spdWithSkills += addValues[2];
        this.defWithSkills += addValues[3];
        this.resWithSkills += addValues[4];
    }

    getReinforcementMerge() {
        let mergeMax = 0;
        if (g_appData.isReinforcementSlotUnit(this)) {
            // 増設枠以外の増援神階英雄のマージの最大値
            for (let unit of g_appData.map.enumerateUnitsInTheSameGroup(this)) {
                if (unit === this) continue;
                let seasons = g_appData.enumerateCurrentSeasons();
                if (unit.hasReinforcementAbility(seasons, unit.groupId === UnitGroupType.Ally)) {
                    mergeMax = Math.max(mergeMax, unit.merge);
                }
            }
        }
        return mergeMax;
    }

    /**
     * 限界突破と神竜の花によるステータス加算を計算する。
     * 限界突破にはエンゲージされた紋章士の凸数も含む
     * @param  {number} ivHighStat
     * @param  {number} ivLowStat
     * @param  {number} ascendedAsset
     * @param  {number} merge
     * @param  {number} dragonflower
     * @param  {number} emblemHeroMerge
     * @param  {number} reinforcementMerge
     * @param  {number} hpLv1
     * @param  {number} atkLv1
     * @param  {number} spdLv1
     * @param  {number} defLv1
     * @param  {number} resLv1
     */
    static calcStatusAddValuesByMergeAndDragonFlower(
        ivHighStat, ivLowStat, ascendedAsset,
        merge, dragonflower, emblemHeroMerge,
        reinforcementMerge,
        hpLv1,
        atkLv1,
        spdLv1,
        defLv1,
        resLv1
    ) {
        let hpLv1IvChange = 0;
        let atkLv1IvChange = 0;
        let spdLv1IvChange = 0;
        let defLv1IvChange = 0;
        let resLv1IvChange = 0;
        switch (ivHighStat) {
            case StatusType.None:
                break;
            case StatusType.Hp:
                hpLv1IvChange = 1;
                break;
            case StatusType.Atk:
                atkLv1IvChange = 1;
                break;
            case StatusType.Spd:
                spdLv1IvChange = 1;
                break;
            case StatusType.Def:
                defLv1IvChange = 1;
                break;
            case StatusType.Res:
                resLv1IvChange = 1;
                break;
        }

        // 開花得意は順序に影響しない
        // switch (ascendedAsset) {
        //     case StatusType.None: break;
        //     case StatusType.Hp: hpLv1IvChange = 1; break;
        //     case StatusType.Atk: atkLv1IvChange = 1; break;
        //     case StatusType.Spd: spdLv1IvChange = 1; break;
        //     case StatusType.Def: defLv1IvChange = 1; break;
        //     case StatusType.Res: resLv1IvChange = 1; break;
        // }

        switch (ivLowStat) {
            case StatusType.None:
                break;
            case StatusType.Hp:
                hpLv1IvChange = -1;
                break;
            case StatusType.Atk:
                atkLv1IvChange = -1;
                break;
            case StatusType.Spd:
                spdLv1IvChange = -1;
                break;
            case StatusType.Def:
                defLv1IvChange = -1;
                break;
            case StatusType.Res:
                resLv1IvChange = -1;
                break;
        }

        const addValues = [0, 0, 0, 0, 0];

        // 限界突破によるステータス上昇
        if (merge > 0 || dragonflower > 0 || emblemHeroMerge > 0 || reinforcementMerge > 0) {
            const statusList = [
                { type: StatusType.Hp, value: hpLv1 + hpLv1IvChange },
                { type: StatusType.Atk, value: atkLv1 + atkLv1IvChange },
                { type: StatusType.Spd, value: spdLv1 + spdLv1IvChange },
                { type: StatusType.Def, value: defLv1 + defLv1IvChange },
                { type: StatusType.Res, value: resLv1 + resLv1IvChange },
            ];
            statusList.sort((a, b) => {
                // HPは高さに関係なく最優先
                if (b.type == StatusType.Hp) return 1;
                return b.value - a.value;
            });

            if (merge > 0 && ivHighStat === StatusType.None) {
                // 基準値で限界突破済みの場合
                let updatedCount = 0;
                let statIndex = 0;
                do {
                    let targetStatus = statusList[statIndex].type;
                    if (targetStatus !== ascendedAsset) {
                        // 開花得意は基準値の上昇ステータスから除外
                        switch (targetStatus) {
                            case StatusType.Hp:
                                addValues[0] += 1;
                                break;
                            case StatusType.Atk:
                                addValues[1] += 1;
                                break;
                            case StatusType.Spd:
                                addValues[2] += 1;
                                break;
                            case StatusType.Def:
                                addValues[3] += 1;
                                break;
                            case StatusType.Res:
                                addValues[4] += 1;
                                break;
                        }
                        ++updatedCount;
                    }
                    ++statIndex;
                } while (updatedCount !== 3);
            }

            // 限界突破
            for (let mergeItr = 0, statItr = 0; mergeItr < merge; ++mergeItr) {
                Unit.updateStatus(statusList, addValues, statItr);
                statItr += 1;
                Unit.updateStatus(statusList, addValues, statItr);
                statItr += 1;
            }

            // 神竜の花
            for (let i = 0; i < dragonflower; ++i) {
                Unit.updateStatus(statusList, addValues, i);
            }

            // 紋章士の限界突破
            for (let i = 0; i < emblemHeroMerge; ++i) {
                Unit.updateStatus(statusList, addValues, i);
            }

            // 増援のステータス上昇
            for (let i = 0; i < reinforcementMerge * 2; ++i) {
                Unit.updateStatus(statusList, addValues, i);
            }
        }

        return addValues;
    }

    static updateStatus(statusList, addValues, statItr) {
        let statIndex = statItr % 5;
        switch (statusList[statIndex].type) {
            case StatusType.Hp:
                addValues[0] += 1;
                break;
            case StatusType.Atk:
                addValues[1] += 1;
                break;
            case StatusType.Spd:
                addValues[2] += 1;
                break;
            case StatusType.Def:
                addValues[3] += 1;
                break;
            case StatusType.Res:
                addValues[4] += 1;
                break;
        }
    }

    canHeal(requiredHealAmount = 1) {
        if (this.hasStatusEffect(StatusEffectType.DeepWounds)) {
            return false;
        }

        return this.currentDamage >= requiredHealAmount;
    }

    /**
     * @returns {Generator<SkillInfo>}
     */
    * #enumerateSkillInfo(info) {
        if (info != null) {
            yield info;
        }
    }

    /**
     * @returns {Generator<SkillInfo>}
     */
    * enumerateSkillInfos() {
        let infos = [
            this.weaponInfo,
            this.supportInfo,
            this.specialInfo,
            this.passiveAInfo,
            this.passiveBInfo,
            this.passiveCInfo,
            this.passiveSInfo,
            this.passiveXInfo,
        ];
        for (let info of infos) {
            yield* this.#enumerateSkillInfo(info);
        }
        if (this.isCaptain) {
            yield* this.#enumerateSkillInfo(this.captainInfo);
        }
    }

    /**
     * @param {number} id
     * @param {boolean} canRefine
     * @returns {Generator<number|string>}
     */
    * #enumerateSkills(id, canRefine = false) {
        if (id !== NoneValue) {
            yield id;
            if (canRefine) {
                if (this.isWeaponRefined) {
                    yield getRefinementSkillId(id);
                }
                if (this.isWeaponSpecialRefined) {
                    yield getSpecialRefinementSkillId(id);
                }
                if (!this.isWeaponRefined) {
                    yield getNormalSkillId(id);
                }
            }
        }
    }

    /**
     * @returns {Generator<number|string>}
     */
    * enumerateSkills() {
        yield* this.#enumerateSkills(this.weapon, true);
        yield* this.#enumerateSkills(this.support);
        yield* this.#enumerateSkills(this.special);
        // passiveA-X
        yield* this.enumeratePassiveSkills()
        if (this.isCaptain) {
            yield* this.#enumerateSkills(this.captain);
        }
        if (this.emblemHeroIndex > 0) {
            yield getEmblemHeroSkillId(this.emblemHeroIndex);
        }
        yield* this.getStatusEffects().map(getStatusEffectSkillId);
    }

    /**
     * @returns {Generator<number|string>}
     */
    * enumeratePassiveSkills() {
        let passives = [
            this.passiveA,
            this.passiveB,
            this.passiveC,
            this.passiveS,
            this.passiveX,
        ];
        for (let passive of passives) {
            yield* this.#enumerateSkills(passive);
        }
    }

    /**
     * @returns {Generator<number|string>}
     */
    * enumerateWeaponSkills() {
        yield* this.#enumerateSkills(this.weapon, true);
    }

    hasDagger7Effect() {
        switch (this.weapon) {
            case Weapon.Pesyukado:
            case Weapon.SaizoNoBakuenshin:
                return false;
            default:
                return !this.hasDagger6Effect()
                    && !this.hasDagger5Effect()
                    && !this.hasDagger4Effect()
                    && !this.hasDagger3Effect()
                    && this.weapon !== Weapon.PoisonDaggerPlus
                    && this.weapon !== Weapon.PoisonDagger
                    && this.weapon !== Weapon.DeathlyDagger
                    && isWeaponTypeDagger(this.weaponType);
        }
    }

    hasDagger6Effect() {
        switch (this.weapon) {
            case Weapon.ShienNoAnkiPlus:
            case Weapon.MitteiNoAnki:
                return true;
            default:
                return false;
        }
    }

    hasDagger5Effect() {
        switch (this.weapon) {
            case Weapon.GinNoAnki:
            case Weapon.RogueDaggerPlus:
            case Weapon.SyukuseiNoAnki:
            case Weapon.YoiyamiNoDanougi:
            case Weapon.RyokuunNoMaiougi:
            case Weapon.SeitenNoMaiougi:
            case Weapon.AnsatsuSyuriken:
            case Weapon.Kagamimochi:
            case Weapon.ButosaiNoSensu:
                return true;
            default:
                return false;
        }
    }

    hasDagger4Effect() {
        switch (this.weapon) {
            case Weapon.ShienNoAnki:
                return true;
            default:
                return false;
        }
    }

    hasDagger3Effect() {
        switch (this.weapon) {
            case Weapon.TetsuNoAnki:
            case Weapon.DouNoAnki:
            case Weapon.RogueDagger:
                return true;
            default:
                return false;
        }
    }

    __hasDuel3Skill() {
        if (this.passiveAInfo == null) {
            return false;
        }

        return this.passiveAInfo.isDuel3();
    }

    __hasDuel4Skill() {
        if (this.passiveAInfo == null) {
            return false;
        }

        return this.passiveAInfo.isDuel4();
    }

    /**
     * @param  {number} majorSeason=SeasonType.None
     * @param  {number} minorSeason=SeasonType.None
     */
    updateArenaScore(majorSeason = SeasonType.None, minorSeason = SeasonType.None) {
        if (this.heroIndex < 0) {
            this.__clearArenaScore();
            return;
        }

        this.arenaScore = this.calcCurrentArenaScore(majorSeason, minorSeason);
    }

    calcCurrentArenaScore(majorSeason = SeasonType.None, minorSeason = SeasonType.None) {
        if (this.heroInfo == null) {
            return 0;
        }

        let totalSp = this.__updateAndGetTotalSp();
        let merge = this.__getArenaMerges(majorSeason, minorSeason);
        let rating = this.__getArenaRating();
        return this.__calcArenaScore(rating, totalSp, merge, this.rarity);
    }

    /**
     * @param  {Number} totalSp
     * @returns {Number}
     */
    calcArenaScore(totalSp) {
        let merge = this.__getArenaMerges();
        let rating = this.__getArenaRating();
        return this.__calcArenaScore(rating, totalSp, merge, this.rarity);
    }

    /**
     * @returns {Number}
     */
    __getArenaMerges(majorSeason = SeasonType.None, minorSeason = SeasonType.None) {
        let merge = Number(this.merge);
        if (majorSeason !== SeasonType.None && this.providableBlessingSeason === majorSeason) {
            merge += 10;
        } else if (minorSeason !== SeasonType.None && this.providableBlessingSeason === minorSeason) {
            merge += 5;
        }
        return merge;
    }

    __clearArenaScore() {
        this.weaponSp = 0;
        this.supportSp = 0;
        this.specialSp = 0;
        this.passiveASp = 0;
        this.passiveBSp = 0;
        this.passiveCSp = 0;
        this.passiveSSp = 0;
        this.passiveXSp = 0;
        this.totalSp = 0;
        this.arenaScore = this.__calcArenaScore(0, 0, 0, 0);
    }

    /**
     * @returns {Number}
     */
    __updateAndGetTotalSp() {
        this.weaponSp = this.__getWeaponSp();
        this.supportSp = this.supportInfo != null ? this.supportInfo.sp : 0;
        this.specialSp = this.specialInfo != null ? this.specialInfo.sp : 0;
        this.passiveASp = this.passiveAInfo != null ? this.passiveAInfo.sp : 0;
        this.passiveBSp = this.passiveBInfo != null ? this.passiveBInfo.sp : 0;
        this.passiveCSp = this.passiveCInfo != null ? this.passiveCInfo.sp : 0;
        this.passiveSSp = this.passiveSInfo != null ? this.passiveSInfo.sp : 0;
        this.passiveXSp = this.passiveXInfo != null ? this.passiveXInfo.sp : 0;
        this.totalSp = this.getTotalSp();
        return this.totalSp;
    }

    __getWeaponSp() {
        let weaponSp = 0;
        if (this.weaponInfo != null) {
            weaponSp = this.weaponInfo.sp;
            if (weaponSp === 300 && this.isWeaponRefined) {
                weaponSp += 50;
            }
        }
        return weaponSp;
    }

    getTotalSp() {
        let totalSp = 0;
        totalSp += this.__getWeaponSp();
        totalSp += this.specialInfo != null ? this.specialInfo.sp : 0;
        totalSp += this.supportInfo != null ? this.supportInfo.sp : 0;
        totalSp += this.passiveAInfo != null ? this.passiveAInfo.sp : 0;
        totalSp += this.passiveBInfo != null ? this.passiveBInfo.sp : 0;
        totalSp += this.passiveCInfo != null ? this.passiveCInfo.sp : 0;
        totalSp += this.passiveSInfo != null ? this.passiveSInfo.sp : 0;
        totalSp += this.passiveXInfo != null ? this.passiveXInfo.sp : 0;
        return totalSp;
    }

    /**
     * 闘技場スコアが最大になる個性に設定します。現在の個性が最大なら個性を変更しません。
     */
    setToMaxScoreAsset() {
        let origMerge = this.merge;
        if (this.merge === 0) {
            // 限界突破していない場合は査定計算のために一時的に限界突破
            this.merge = 1;
        }

        // 現在の個性で査定計算
        let defaultAsset = this.ivHighStat;
        let defaultFlaw = this.ivLowStat;
        let defaultScore = this.calcArenaBaseStatusScore();
        let assetStatuses = [
            StatusType.Hp,
            StatusType.Atk,
            StatusType.Spd,
            StatusType.Def,
            StatusType.Res
        ];

        // すべての個性で評価して現在より大きい査定になるものがあればそれに設定
        for (let asset of assetStatuses.filter(x => x !== defaultAsset)) {
            this.ivHighStat = asset;
            this.ivLowStat = StatusType.None; // 不得意は関係ないので None にしておく
            let score = this.calcArenaBaseStatusScore();
            if (score > defaultScore) {
                // 適当な不得意を設定
                this.ivLowStat = assetStatuses.find(x => x !== this.ivHighStat);
                break;
            }
            this.ivHighStat = defaultAsset;
            this.ivLowStat = defaultFlaw;
        }

        this.merge = origMerge;
    }

    calcArenaBaseStatusScore() {
        if (this.heroInfo == null) {
            return 0;
        }

        let rating = this.__getArenaRating();
        return calcArenaBaseStatusScore(rating);
    }

    /**
     * @returns {Number}
     */
    __getArenaRating() {
        let hp = this.__calcStatusLvN(this.heroInfo.hpLv1, this.heroInfo.hp, this.__getIvType(StatusType.Hp));
        let atk = this.__calcStatusLvN(this.heroInfo.atkLv1, this.heroInfo.atk, this.__getIvType(StatusType.Atk));
        let spd = this.__calcStatusLvN(this.heroInfo.spdLv1, this.heroInfo.spd, this.__getIvType(StatusType.Spd));
        let def = this.__calcStatusLvN(this.heroInfo.defLv1, this.heroInfo.def, this.__getIvType(StatusType.Def));
        let res = this.__calcStatusLvN(this.heroInfo.resLv1, this.heroInfo.res, this.__getIvType(StatusType.Res));
        let addValue = this.ivHighStat === StatusType.None && this.ivLowStat === StatusType.None && this.merge > 0 ? 3 : 0;
        let rating = hp + atk + spd + def + res + addValue;

        if (rating < this.heroInfo.duelScore) {
            rating = this.heroInfo.duelScore;
        }
        if (rating < 170 && this.__hasDuel3Skill()) {
            rating = 170;
        } else if (this.__hasDuel4Skill()) {
            let duel4Rating = this.getDuel4Rating();
            if (rating < duel4Rating) {
                rating = duel4Rating;
            }
        }

        return rating;
    }

    getDuel4Rating() {
        if (this.isMythicHero || this.isLegendaryHero) {
            return 175;
        } else {
            return 180;
        }
    }

    __getIvType(statusType, includesAscendedAsset = false) {
        return this.ivHighStat === statusType ?
            IvType.Asset : this.ivLowStat === statusType ?
                IvType.Flaw : includesAscendedAsset && this.ascendedAsset === statusType ? IvType.Asset : IvType.None;
    }

    __calcArenaScore(rating, totalSp, rebirthCount, rarity = 5) {
        let base = 150;
        let rarityBase = rarity * 2 + 45;
        let levelScore = 0;
        switch (rarity) {
            case 5:
                levelScore = Math.floor(this.level * 2.33);
                break;
            case 4:
                levelScore = Math.floor(this.level * 2.15);
                break;
            case 3:
                levelScore = Math.floor(this.level * 2.03);
                break;
            case 2:
                levelScore = Math.floor(this.level * 1.87);
                break;
            case 1:
                levelScore = Math.floor(this.level * 1.74);
                break;
        }
        this.rarityScore = rarityBase;
        this.levelScore = levelScore;

        let baseStatusTotal = rating;
        this.rating = baseStatusTotal;
        return base + levelScore + rarityBase
            + calcArenaBaseStatusScore(baseStatusTotal)
            + calcArenaTotalSpScore(totalSp) + (rebirthCount * 2);
    }

    initializeSkillsToDefault() {
        let heroInfo = this.heroInfo;
        this.weapon = heroInfo.weapon;
        this.weaponRefinement = WeaponRefinementType.None;
        this.support = heroInfo.support;
        this.special = heroInfo.special;
        this.passiveA = heroInfo.passiveA;
        this.passiveB = heroInfo.passiveB;
        this.passiveC = heroInfo.passiveC;
        // this.passiveS = heroInfo.passiveS;
        this.passiveX = heroInfo.passiveX;
    }

    hasMovementAssist() {
        if (this.supportInfo == null) {
            return false;
        }

        return this.supportInfo.assistType === AssistType.Move;
    }

    setGrantedBlessingIfPossible(value) {
        if (this.providableBlessingSeason !== SeasonType.None) {
            this.grantedBlessing = value;
        }
    }

    get detailPageUrl() {
        if (this.heroInfo == null) {
            return "";
        }
        return this.heroInfo.detailPageUrl;
    }

    setToNone() {
        this.heroInfo = null;
        this.heroIndex = -1;
        this._maxHpWithSkills = 0;
        this.#hpAddAfterEnteringBattle = 0;
        this.atkWithSkills = 0;
        this.spdWithSkills = 0;
        this.defWithSkills = 0;
        this.resWithSkills = 0;
        this.weaponRefinement = WeaponRefinementType.None;
        this.weapon = Weapon.None;
        this.support = Support.None;
        this.special = Special.None;
        this.passiveA = PassiveA.None;
        this.passiveB = PassiveB.None;
        this.passiveC = PassiveC.None;
        this.passiveS = PassiveS.None;
        this.passiveX = PassiveX.None;
        this.merge = 0;
        this.dragonflower = 0;
        this._greatTalents = [0, 0, 0, 0];
    }

    /**
     * データベースの英雄情報からユニットを初期化します。
     * @param  {HeroInfo} heroInfo
     */
    initByHeroInfo(heroInfo) {
        let isHeroInfoChanged = this.heroInfo !== heroInfo;
        if (!isHeroInfoChanged) {
            return;
        }

        this.heroInfo = heroInfo;
        this.providableBlessingSeason = heroInfo.seasonType;
        if (this.providableBlessingSeason !== SeasonType.None) {
            this.grantedBlessing = SeasonType.None;
        }

        this.name = heroInfo.name;
        this.__updateNameWithGroup();

        this.weaponType = stringToWeaponType(heroInfo.weaponType);
        this.moveType = heroInfo.moveType;
        this.maxHp = heroInfo.hp;
        this.atk = heroInfo.atk;
        this.spd = heroInfo.spd;
        this.def = heroInfo.def;
        this.res = heroInfo.res;
        if (heroInfo.atk === 0) {
            // まだDBにステータスが定義されていないので適当に割り当て
            if (heroInfo.hp === 0) {
                this.maxHp = 40;
            }
            this.atk = 40;
            this.spd = 40;
            this.def = 30;
            this.res = 30;
        }

        this.hpLv1 = heroInfo.hpLv1;
        this.atkLv1 = heroInfo.atkLv1;
        this.spdLv1 = heroInfo.spdLv1;
        this.defLv1 = heroInfo.defLv1;
        this.resLv1 = heroInfo.resLv1;
        this.hpIncrement = heroInfo.hpIncrement;
        this.atkIncrement = heroInfo.atkIncrement;
        this.spdIncrement = heroInfo.spdIncrement;
        this.defIncrement = heroInfo.defIncrement;
        this.resIncrement = heroInfo.resIncrement;
        this.hpDecrement = heroInfo.hpDecrement;
        this.atkDecrement = heroInfo.atkDecrement;
        this.spdDecrement = heroInfo.spdDecrement;
        this.defDecrement = heroInfo.defDecrement;
        this.resDecrement = heroInfo.resDecrement;

        if (this.canHavePairUpUnit && this.pairUpUnit == null) {
            this.__createPairUpUnitInstance();
        }

        // this.updatePureGrowthRate();
    }

    __createPairUpUnitInstance() {
        this.pairUpUnit = new Unit();
        this.pairUpUnit.heroIndex = -1;
        this.pairUpUnit.isPairUpUnit = true;
    }

    updateStatusBySkillsAndMerges(updatesPureGrowthRate = true, syncBlessingEffects = true, isPairUpBoostsEnabled = false) {
        this.updateBaseStatus(updatesPureGrowthRate);

        this.maxHpWithSkillsWithoutAdd = this.hpLvN;
        this.#hpAddAfterEnteringBattle = 0;
        this.atkWithSkills = Math.floor(Number(this.atkLvN) * Number(this.atkMult) + Number(this.atkAdd));
        this.spdWithSkills = Math.floor(Number(this.spdLvN) * Number(this.spdMult) + Number(this.spdAdd));
        this.defWithSkills = Math.floor(Number(this.defLvN) * Number(this.defMult) + Number(this.defAdd));
        this.resWithSkills = Math.floor(Number(this.resLvN) * Number(this.resMult) + Number(this.resAdd));

        // 個体値と限界突破によるステータス上昇
        this.updateStatusByMergeAndDragonFlower();

        // 祝福によるステータス変化
        this.updateStatusByBlessing(syncBlessingEffects);

        // 武器錬成
        this.updateStatusByWeaponRefinement();

        // 召喚士との絆
        this.updateStatusBySummonerLevel();

        this.updateStatusByWeapon();

        this.updateStatusBySkillsExceptWeapon();

        switch (this.weapon) {
            case Weapon.DaichiBoshiNoBreath:
                if (this.isWeaponSpecialRefined) {
                    this.atkWithSkills += 4;
                    this.spdWithSkills += 4;
                    this.defWithSkills += 4;
                    this.resWithSkills += 4;
                }
                break;
            case Weapon.SyunsenAiraNoKen:
                if (this.isWeaponRefined) {
                    this.atkWithSkills += 3;
                }
                break;
            case Weapon.Mistoruthin:
                if (this.isWeaponSpecialRefined) {
                    this.atkWithSkills += 3;
                    this.spdWithSkills += 3;
                    this.defWithSkills += 3;
                    this.resWithSkills += 3;
                }
                break;
            case Weapon.KokouNoKen:
            case Weapon.Bashirikosu:
                if (this.isWeaponSpecialRefined) {
                    this.spdWithSkills += 5;
                    this.atkWithSkills += 5;
                    this.defWithSkills -= 5;
                    this.resWithSkills -= 5;
                }
                break;
            case Weapon.Yatonokami:
                if (this.weaponRefinement !== WeaponRefinementType.None) {
                    this.atkWithSkills += 2;
                    this.spdWithSkills += 2;
                    this.defWithSkills += 2;
                    this.resWithSkills += 2;
                }
                break;
            case Weapon.BatoruNoGofu:
            case Weapon.HinataNoMoutou:
                if (this.isWeaponSpecialRefined) {
                    this.atkWithSkills += 3;
                    this.spdWithSkills += 3;
                    this.defWithSkills += 3;
                    this.resWithSkills += 3;
                }
                break;
        }

        // 化身によるステータス変化
        if (this.isTransformed) {
            if (isWeaponTypeThatCanAddAtk2AfterTransform(this.weapon)) {
                this.atkWithSkills += 2;
            }
        }

        // ボナキャラ補正
        if (this.isBonusChar) {
            this.addHpAfterEnteringBattle(10);
            this.atkWithSkills += 4;
            this.spdWithSkills += 4;
            this.defWithSkills += 4;
            this.resWithSkills += 4;
        }

        // 神装
        if (this.isResplendent) {
            this.maxHpWithSkillsWithoutAdd += 2;
            this.atkWithSkills += 2;
            this.spdWithSkills += 2;
            this.defWithSkills += 2;
            this.resWithSkills += 2;
        }

        // ダブル補正
        if (isPairUpBoostsEnabled && this.hasPairUpUnit) {
            this.atkWithSkills += Math.max(0, Math.trunc((this.pairUpUnit.atkWithSkills - 25) / 10));
            this.spdWithSkills += Math.max(0, Math.trunc((this.pairUpUnit.spdWithSkills - 10) / 10));
            this.defWithSkills += Math.max(0, Math.trunc((this.pairUpUnit.defWithSkills - 10) / 10));
            this.resWithSkills += Math.max(0, Math.trunc((this.pairUpUnit.resWithSkills - 10) / 10));
        }

        // お供補正
        if (this.isAidesEssenceUsed) {
            this.maxHpWithSkillsWithoutAdd += 1;
            this.atkWithSkills += 1;
            this.spdWithSkills += 1;
            this.defWithSkills += 1;
            this.resWithSkills += 1;
        }
    }

    get hasPairUpUnit() {
        return this.canHavePairUpUnit && this.pairUpUnit != null && this.pairUpUnit.heroInfo != null;
    }

    /**
     * ステータスにスキルの加算値を加算します。
     */
    updateStatusBySkillsExceptWeapon() {
        for (let skillInfo of this.enumerateSkillInfos()) {
            if (skillInfo === this.weaponInfo) {
                continue;
            }

            this.maxHpWithSkillsWithoutAdd += skillInfo.hp;
            this.atkWithSkills += skillInfo.atk;
            this.spdWithSkills += skillInfo.spd;
            this.defWithSkills += skillInfo.def;
            this.resWithSkills += skillInfo.res;
        }
    }

    updateStatusByWeapon() {
        if (this.weapon !== Weapon.None) {
            let weaponInfo = this.weaponInfo;
            if (weaponInfo != null) {
                if (this.weaponRefinement !== WeaponRefinementType.None) {
                    this.atkWithSkills += weaponInfo.mightRefine;
                } else {
                    this.atkWithSkills += weaponInfo.might;
                }
                this.atkWithSkills += weaponInfo.atk;
                this.spdWithSkills += weaponInfo.spd;
                this.defWithSkills += weaponInfo.def;
                this.resWithSkills += weaponInfo.res;
            }

            switch (this.weapon) {
                case Weapon.MasyouNoYari:
                    if (this.isWeaponRefined) {
                        // 武器錬成なしの時に攻速は+2されてる
                        this.atkWithSkills += 1;
                        this.spdWithSkills += 1;
                        this.defWithSkills += 3;
                        this.resWithSkills += 3;
                    }
                    break;
            }
        }
    }

    resetMaxSpecialCount() {
        if (this.special === Special.None) {
            this.maxSpecialCount = 0;
            this.specialCount = 0;
            return;
        }

        if (this.specialInfo == null) {
            console.warn(`special ID ${this.special} was not found.`);
            return;
        }

        let specialCountMax = this.specialInfo.specialCount;
        if (this.weaponInfo != null) {
            specialCountMax += this.weaponInfo.cooldownCount;
        }
        for (let skillId of this.enumerateSkills()) {
            specialCountMax += getSkillFunc(skillId, resetMaxSpecialCountFuncMap)?.call(this) ?? 0;
            switch (skillId) {
                case Weapon.CrimeanScepter:
                case Weapon.DuskDawnStaff:
                    if (specialCountMax === 0) {
                        specialCountMax = 1;
                    }
                    break;
                // 特殊錬成時に奥義が発動しやすくなる
                case Weapon.NightmareHorn:
                case Weapon.Sekuvaveku:
                case Weapon.Ifingr:
                case Weapon.ZekkaiNoSoukyu:
                case Weapon.DarkSpikesT:
                case Weapon.HikariNoKen:
                case Weapon.Ragnell:
                case Weapon.Alondite:
                    if (this.isWeaponSpecialRefined) {
                        specialCountMax -= 1;
                    }
                    break;
                // 錬成時に奥義が発動しやすくなる
                case Weapon.PhantasmTome:
                case Weapon.SyunsenAiraNoKen:
                    if (this.isWeaponRefined) {
                        specialCountMax -= 1;
                    }
                    break;
            }
        }
        // TODO: 常に奥義カウントが0になるスキルが実装されたら修正する
        if (specialCountMax <= 0) {
            specialCountMax = 1;
        }

        this.maxSpecialCount = specialCountMax;
        if (this.specialCount > this.maxSpecialCount) {
            this.specialCount = this.maxSpecialCount;
        }
    }

    /// テレポート系スキルを所持していたり、状態が付与されていて、テレポートが可能な状態かどうかを判定します。
    // noinspection JSUnusedGlobalSymbols
    canTeleport() {
        if (this.hasStatusEffect(StatusEffectType.AirOrders)) {
            return true;
        }
        for (let skillId of this.enumerateSkills()) {
            if (isTeleportationSkill(skillId)) {
                return true;
            }
        }
        return false;
    }

    __canExecuteHarshCommand(targetUnit) {
        if (!targetUnit.isDebuffed) {
            return false;
        }
        if (targetUnit.atkDebuff < 0 && -targetUnit.atkDebuff > (targetUnit.atkBuff)) {
            return true;
        }
        if (targetUnit.spdDebuff < 0 && -targetUnit.spdDebuff > (targetUnit.spdBuff)) {
            return true;
        }
        if (targetUnit.defDebuff < 0 && -targetUnit.defDebuff > (targetUnit.defBuff)) {
            return true;
        }
        // noinspection RedundantIfStatementJS
        if (targetUnit.resDebuff < 0 && -targetUnit.resDebuff > (targetUnit.resBuff)) {
            return true;
        }
        return false;
    }

    /**
     * 応援や一喝を実行可能かどうかを返します。
     * @returns {boolean}
     */
    canRallyTo(targetUnit, buffAmountThreshold) {
        let assistUnit = this;
        let skillId = assistUnit.support;
        if (canAddStatusEffectByRallyFuncMap.has(skillId)) {
            // TODO: 以下を検証する
            // ステータスを付与できないのであればバフをかけられようとも応援しない。
            return canAddStatusEffectByRallyFuncMap.get(skillId).call(this, assistUnit, targetUnit);
        }
        switch (skillId) {
            case Support.HarshCommandPlus:
                if (targetUnit.hasNegativeStatusEffect()) {
                    return true;
                }
                return this.__canExecuteHarshCommand(targetUnit);
            case Support.HarshCommand:
                return this.__canExecuteHarshCommand(targetUnit);
            default:
                if ((getAtkBuffAmount(skillId) - targetUnit.atkBuff) >= buffAmountThreshold) {
                    return true;
                }
                if ((getSpdBuffAmount(skillId) - targetUnit.spdBuff) >= buffAmountThreshold) {
                    return true;
                }
                if ((getDefBuffAmount(skillId) - targetUnit.defBuff) >= buffAmountThreshold) {
                    return true;
                }
                // noinspection RedundantIfStatementJS
                if ((getResBuffAmount(skillId) - targetUnit.resBuff) >= buffAmountThreshold) {
                    return true;
                }
                return false;
        }
    }

    /**
     * 実際に補助可能なユニットとタイルを列挙します。
     * @param {boolean} isCantoAssist
     */
    * enumerateActuallyAssistableUnitAndTiles(isCantoAssist = false) {
        for (let unit of this.enumerateAssistableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                let range = isCantoAssist ? this.cantoAssistRange : this.assistRange;
                if (dist === range) {
                    yield [unit, tile];
                }
            }
        }
    }

    /// 実際に破壊可能な配置物とタイルを列挙します。
    * enumerateActuallyBreakableStructureAndTiles() {
        for (let structure of this.enumerateBreakableStructures()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistance(structure.placedTile);
                if (dist === this.attackRange) {
                    yield [structure, tile];
                }
            }
        }
    }

    /**
     * 実際に攻撃可能なユニットとタイルを列挙します。
     * スタイル変更時も含みます。
     * TODO: スタイル変更フラグを渡せるようにする
     */
    * enumerateActuallyAttackableUnitAndTiles() {
        for (let unit of this.enumerateAttackableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist === this.attackRange) {
                    yield [unit, tile];
                }
            }
        }
        for (let unit of this.enumerateAttackableUnitsInCannotMoveStyle()) {
            yield [unit, this.placedTile];
        }
    }

    /// 補助可能なユニットを列挙します。
    * enumerateAssistableUnits() {
        for (let tile of this.assistableTiles) {
            let unit = tile.placedUnit;
            if (unit === this) continue;
            if (unit != null && unit.groupId === this.groupId) {
                if (unit.hasStatusEffect(StatusEffectType.Isolation)) {
                    continue;
                }

                yield unit;
            }
        }
    }

    /// 攻撃可能な壊せる壁や施設を列挙します。
    * enumerateBreakableStructures() {
        for (let tile of this.attackableTiles) {
            if (tile.obj != null && this.canBreak(tile.obj)) {
                yield tile.obj;
            }
        }
    }

    /// 移動可能なマスを列挙します。
    * enumerateMovableTiles(ignoresTileUnitPlaced = true) {
        for (let tile of this.movableTiles) {
            if (ignoresTileUnitPlaced || (tile.placedUnit == null || tile.placedUnit === this)) {
                yield tile;
            }
        }
    }

    /// ユニットが破壊可能な配置物であるかどうかを判定します。
    canBreak(structure) {
        return structure instanceof BreakableWall
            || (structure.isBreakable
                && (
                    (this.groupId === UnitGroupType.Ally && structure instanceof DefenceStructureBase)
                    || (this.groupId === UnitGroupType.Enemy && structure instanceof OffenceStructureBase)
                ));
    }

    /// 補助スキルの射程です。
    get assistRange() {
        return getAssistRange(this.support);
    }

    /// 補助スキルを所持していればtrue、そうでなければfalseを返します。
    get hasSupport() {
        return this.support !== Support.None;
    }

    /// 天駆の道の効果を持つか
    hasPathfinderEffect() {
        if (this.hasStatusEffect(StatusEffectType.Pathfinder) &&
            !this.hasStatusEffect(StatusEffectType.Schism)) {
            return true;
        }
        for (let skillId of this.enumerateSkills()) {
            if (hasPathfinderEffect(skillId)) {
                return true;
            }
        }
        return false;
    }

    get isTome() {
        return isWeaponTypeTome(this.weaponType);
    }

    getEnemyGroupId() {
        switch (this.groupId) {
            case UnitGroupType.Ally:
                return UnitGroupType.Enemy;
            case UnitGroupType.Enemy:
                return UnitGroupType.Ally;
            default:
                throw new Error("Invalid groupId");
        }
    }

    isSameGroup(otherUnit) {
        return this.groupId === otherUnit.groupId;
    }

    isDifferentGroup(otherUnit) {
        return !this.isSameGroup(otherUnit);
    }

    canCounterAttackToAllDistance() {
        if (this.weaponInfo == null) {
            return false;
        }

        if (this.battleContext.canCounterattackToAllDistance) {
            return true;
        }

        for (let skillInfo of this.enumerateSkillInfos()) {
            if (skillInfo.canCounterattackToAllDistance) {
                return true;
            }
        }

        return false;
    }

    /// 指定した特効を無効化できるかどうかを調べます。
    canInvalidateSpecifiedEffectiveAttack(effective) {
        if (effective === EffectiveType.Flying) {
            if (this.hasStatusEffect(StatusEffectType.ShieldFlying)) {
                return true;
            }
        } else if (effective === EffectiveType.Armor
        ) {
            if (this.hasStatusEffect(StatusEffectType.ShieldArmor)) {
                return true;
            }
        } else if (effective === EffectiveType.Dragon
        ) {
            if (this.hasStatusEffect(StatusEffectType.ShieldDragon)) {
                return true;
            }
        }

        for (let skillInfo of this.enumerateSkillInfos()) {
            if (skillInfo.invalidatedEffectives.includes(effective)) {
                return true;
            }
        }

        switch (this.weapon) {
            case Weapon.Marute:
                if (this.isWeaponRefined && effective === EffectiveType.Armor) {
                    return true;
                }
                break;
        }

        return false;
    }

    /// 神罰の杖を無効化できるか調べます。
    canInvalidateWrathfulStaff() {
        switch (this.weapon) {
            case Weapon.SplashyBucketPlus:
                return true;
        }
        for (let skillId of [this.passiveB, this.passiveS]) {
            switch (skillId) {
                case PassiveB.SeimeiNoGofu3:
                case PassiveB.MysticBoost4:
                    return true;
            }
        }
        return false;
    }

    /**
     * ユニットを中心とした縦〇列と横〇列に自身がいるかどうかを取得します。
     * 例えば縦3列の場合はoffset=1, 5列の場合はoffset=2。
     * @param {Unit} unit
     * @param {number} offset 3x3の場合1
     */
    isInCrossWithOffset(unit, offset) {
        return (unit.posX - offset <= this.posX && this.posX <= unit.posX + offset)
            || (unit.posY - offset <= this.posY && this.posY <= unit.posY + offset);
    }

    /**
     * 自身が指定したユニットの十字方向にいるかどうかを取得します。
     */
    isInCrossOf(unit) {
        return this.posX === unit.posX || this.posY === unit.posY;
    }

    /**
     * ユニットを中心とした縦横N,Mマスに自身がいるかどうかを取得します。
     * @param {Unit} unit
     * @param {number} x
     * @param {number} y
     */
    isInRectangle(unit, x, y) {
        return this.isPosInRectangle(unit.posX, unit.posY, x, y);
    }

    isPosInRectangle(posX, posY, x, y) {
        let xOffset = (x - 1) / 2;
        let yOffset = (y - 1) / 2;
        return Math.abs(posX - this.posX) <= xOffset && Math.abs(posY - this.posY) <= yOffset;
    }

    /**
     * ユニットを中心とした縦横Nマスに自身がいるかどうかを取得します。
     * @param {Unit} unit
     * @param {number} n
     */
    isInSquare(unit, n) {
        return this.isInRectangle(unit, n, n);
    }

    /**
     * 指定したユニットの指定した距離以内に自身がいるかどうかを取得します。
     */
    isWithinSpecifiedDistanceFrom(unit, spaces) {
        let diffX = Math.abs(this.posX - unit.posX);
        let diffY = Math.abs(this.posY - unit.posY);
        let dist = diffX + diffY;
        return dist <= spaces;
    }

    isPosIsInNRowsOrMColumns(posX, posY, x, y) {
        let xOffset = (x - 1) / 2;
        let yOffset = (y - 1) / 2;
        return Math.abs(posX - this.posX) <= xOffset || Math.abs(posY - this.posY) <= yOffset;
    }

    /**
     * ユニットが待ち伏せや攻め立てなどの攻撃順変更効果を無効化できるかどうかを判定します。
     */
    canDisableAttackOrderSwapSkill(restHpPercentage, defUnit) {
        for (let skillId of this.enumerateSkills()) {
            let func = getSkillFunc(skillId, canDisableAttackOrderSwapSkillFuncMap);
            if (func?.call(this, restHpPercentage, defUnit) ?? false) {
                return true;
            }
            switch (skillId) {
                case Weapon.Queensblade:
                    return true;
                case Weapon.ArmorpinDaggerPlus:
                case Weapon.DawnSuzu:
                case Weapon.YoiyamiNoDanougi:
                case Weapon.YoiyamiNoDanougiPlus:
                case Weapon.SeitenNoMaiougi:
                case Weapon.SeitenNoMaiougiPlus:
                case Weapon.RyokuunNoMaiougi:
                case Weapon.RyokuunNoMaiougiPlus:
                case Weapon.RyusatsuNoAnkiPlus:
                case Weapon.CaltropDaggerPlus:
                    return true;
                case PassiveS.HardyBearing1:
                    if (restHpPercentage === 100) {
                        return true;
                    }
                    break;
                case PassiveS.HardyBearing2:
                    if (restHpPercentage >= 50) {
                        return true;
                    }
                    break;
                case PassiveS.HardyBearing3:
                    return true;
            }
        }
        for (let skillId of defUnit.enumerateSkills()) {
            switch (skillId) {
                case Weapon.Queensblade:
                    return true;
            }
        }
        return false;
    }

    /**
     * @param  {boolean} initiatesCombat
     */
    initBattleContext(initiatesCombat) {
        this.battleContext.clear();
        this.battleContext.maxHpWithSkills = this.maxHpWithSkills;
        this.battleContext.hpBeforeCombat = this.hp;
        this.battleContext.restHp = this.hp;
        this.battleContext.initiatesCombat = initiatesCombat;
        this.battleContext.specialCount = this.specialCount;
    }

    canActivatePrecombatSpecial() {
        return this.hasPrecombatSpecial() && Number(this.specialCount) === 0;
    }

    hasPrecombatSpecial() {
        return isPrecombatSpecial(this.special);
    }

    /**
     * @param  {SkillInfo} skillInfo
     */
    canEquip(skillInfo) {
        return this.heroInfo.canEquipSkill(skillInfo);
    }

    /**
     * 再移動の移動数を計算します。
     */
    calcMoveCountForCanto() {
        let moveCountForCanto = 0;
        if (this.hasStatusEffect(StatusEffectType.CantoControl)) {
            return isMeleeWeaponType(this.weaponType) ? 1 : 0;
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
                case Weapon.TheCyclesTurn:
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
                case Weapon.WingLeftedSpear:
                case PassiveB.LunarBrace2:
                case Weapon.NidavellirSprig:
                case Weapon.NidavellirLots:
                case Weapon.HonorableBlade:
                case PassiveB.SolarBrace2:
                case PassiveB.MoonlightBangle:
                case Weapon.DolphinDiveAxe:
                case Weapon.Ladyblade:
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
    }

    __hasSaveSkills() {
        for (let skillId of this.enumerateSkills()) {
            if (SAVE_SKILL_SET.has(skillId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * キラー効果などで奥義カウントの最大値が減らされているかどうか
     */
    isReducedMaxSpecialCount() {
        return this.maxSpecialCount < this.specialInfo?.specialCount ?? 0;
    }

    hasNormalAttackSpecial() {
        return isNormalAttackSpecial(this.special);
    }

    hasDefenseSpecial() {
        return isDefenseSpecial(this.special);
    }

    addHpAfterEnteringBattle(value) {
        this._maxHpWithSkills += value;
        this.#hpAddAfterEnteringBattle += value;
    }

    // 攻撃した側が動いた距離を返す。0ならユニットは移動していない。
    static calcAttackerMoveDistance(unit1, unit2) {
        let unit = unit1.battleContext.initiatesCombat ? unit1 : unit2;
        return unit.moveDistance();
    }

    // 移動した距離を返す(移動前と移動後のマスの距離)
    static calcMoveDistance(unit) {
        return unit.moveDistance();
    }

    canActivateOrActivatedSpecial() {
        let hasSpecial = this.special !== Special.None;
        let canActivateSpecial = hasSpecial && this.tmpSpecialCount === 0;
        return canActivateSpecial || this.battleContext.hasSpecialActivated;
    }

    static canActivateOrActivatedSpecialEither(targetUnit, enemyUnit) {
        return targetUnit.canActivateOrActivatedSpecial() || enemyUnit.canActivateOrActivatedSpecial();
    }

    isMoveTypeIn(moveTypes) {
        for (let moveType of moveTypes) {
            if (this.moveType === moveType) {
                return true;
            }
        }
        return false;
    }

    resetSkillsForSettingByImage() {
        this.passiveS = PassiveS.None;
        this.passiveX = PassiveX.None;
        this.emblemHeroIndex = EmblemHero.None;
        this.emblemHeroMerge = 0;
        this.isBonusChar = false;
    }

    grantsAnotherAction() {
        this.isActionDone = false;
    }

    grantsAnotherActionOnMap() {
        this.isActionDone = false;
    }

    reEnablesCantoOnMap() {
        this.isCantoActivatedInCurrentTurn = false;
    }

    grantsAnotherActionWhenAssist(isAssist) {
        if (isAssist) {
            this.grantsAnotherActionOnAssist();
        } else {
            this.grantsAnotherActionOnAssisted();
        }
    }

    grantsAnotherActionOnAssist() {
        this.isActionDone = false;
        g_appData.globalBattleContext.reservedIsAnotherActionByAssistActivatedInCurrentTurn[this.groupId] = true;
    }

    grantsAnotherActionOnAssisted() {
        this.isActionDone = false;
    }

    grantAnotherActionOnAssistIfPossible() {
        if (!this.isOneTimeActionActivatedForSupport &&
            this.isActionDone) {
            this.isOneTimeActionActivatedForSupport = true;
            this.grantsAnotherActionOnAssist();
            return true;
        }
        return false;
    }

    grantAnotherActionByCallingCircleIfPossible(currentTurn = null) {
        if (currentTurn === null) {
            currentTurn = g_appData.currentTurn;
        }
        if (currentTurn === this.anotherActionTurnForCallingCircle &&
            this.isActionDone) {
            this.anotherActionTurnForCallingCircle = -1;
            this.isActionDone = false;
        }
    }

    hasEmblemHero() {
        return this.emblemHeroIndex !== EmblemHero.None;
    }

    hasSameTitle(targetUnit) {
        return SetUtil.intersection(this.getTitleSet(), targetUnit.getTitleSet()).size > 0;
    }

    /**
     * targetUnitが異なる出典を持っているか
     * @param {Unit} targetUnit
     * @returns {boolean}
     */
    hasDifferentTitle(targetUnit) {
        return SetUtil.difference(targetUnit.getTitleSet(), this.getTitleSet()).size > 0;
    }

    /**
     * タイトル（登場フィルタ）の集合を返す。暗黒竜、紋章は同様のタイトルとみなす。
     * @returns {Set<any>}
     */
    getTitleSet() {
        return new Set(this.heroInfo?.origin?.split('|') ?? [].map(Unit.#originToTitle));
    }

    static #originToTitle(origin) {
        let map = new Map([
            ['暗黒竜と光の剣', '暗黒竜・紋章'],
            ['紋章の謎', '暗黒竜・紋章'],
            ['新・紋章の謎', '暗黒竜・紋章'],
        ]);
        if (map.has(origin)) {
            return map.get(origin);
        }
        return origin;
    }

    /**
     * @returns {boolean}
     */
    get isStyleActive() {
        return this._isStyleActive;
    }

    /**
     * @param {boolean} value
     */
    set isStyleActive(value) {
        this._isStyleActive = value;
    }

    /**
     * 発動可能なスタイルを返す。スタイルが複数ある場合はSTYLE_TYPE.NONEを返す。
     * @returns {number}
     */
    getAvailableStyle() {
        let skills = this.getStyles();
        if (skills.length === 1) {
            return skills[0];
        }
        return STYLE_TYPE.NONE;
    }

    /**
     * 現在アクティブになっているスタイルを返す。
     * スタイルがない時またはスタイルがアクティブになっていない時STYLE_TYPE.NONEを返す。
     * @returns {number}
     */
    getCurrentStyle() {
        return this.isStyleActive ? this.getAvailableStyle() : STYLE_TYPE.NONE;
    }

    /**
     * 所有スキルにある全てのスタイルを返す。
     * @returns {number[]}
     */
    getStyles() {
        let styles = [];
        for (let skillId of this.enumerateSkills()) {
            if (SKILL_STYLE_MAP.has(skillId)) {
                styles.push(SKILL_STYLE_MAP.get(skillId));
            }
        }
        return styles;
    }

    hasAvailableStyle() {
        return this.getAvailableStyle() !== STYLE_TYPE.NONE;
    }

    /**
     * @param {...number} styles
     * @returns {boolean}
     */
    isAnyStyleActive(...styles) {
        return styles.includes(this.getCurrentStyle());
    }

    activateStyle() {
        if (this.hasAvailableStyle()) {
            this._isStyleActive = true;
        }
    }

    deactivateStyle() {
        this._isStyleActive = false;
    }

    isCannotMoveStyleActive() {
        return this.isAnyStyleActive(...CANNOT_MOVE_STYLE_SET);
    }

    /**
     * 利用可能なスタイルがただ1つ存在して発動状態にできる（現在未発動）。
     * @returns {boolean}
     */
    canActivateStyle() {
        if (this.hasAvailableStyleButCannotActivate()) {
            return false;
        }
        return this.hasAvailableStyle() && !this.isStyleActive;
    }

    /**
     * 利用可能なスタイルがただ1つ存在して未発動状態にできる（現在発動中）。
     * @returns {boolean}
     */
    canDeactivateStyle() {
        if (this.hasAvailableStyleButCannotActivate()) {
            return false;
        }
        return this.hasAvailableStyle() && this.isStyleActive;
    }

    hasAvailableStyleButCannotActivate() {
        if (!this.hasAvailableStyle() || this.isStyleActive) {
            return false;
        }
        if (this.isStyleActivatedInThisTurn) {
            return true;
        }
        let env = new NodeEnv().setTarget(this).setSkillOwner(this);
        env.setName("スタイル発動可能判定").setLogLevel(LoggerBase.LOG_LEVEL.OFF);
        // env.setName("スタイル発動可能判定").setLogLevel(getSkillLogLevel());
        return !CAN_ACTIVATE_STYLE_HOOKS.evaluateSomeWithUnit(this, env);
    }

    hasCannotMoveStyle() {
        return this.hasAvailableStyle() && CANNOT_MOVE_STYLE_SET.has(this.getAvailableStyle());
    }
}


function calcBuffAmount(assistUnit, targetUnit) {
    let totalBuffAmount = 0;
    switch (assistUnit.support) {
        case Support.HarshCommand: {
            if (!targetUnit.isPanicEnabled) {
                totalBuffAmount += targetUnit.atkDebuff;
                totalBuffAmount += targetUnit.spdDebuff;
                totalBuffAmount += targetUnit.defDebuff;
                totalBuffAmount += targetUnit.resDebuff;
            }
        }
            break;
        case Support.HarshCommandPlus: {
            totalBuffAmount += targetUnit.atkDebuff;
            totalBuffAmount += targetUnit.spdDebuff;
            totalBuffAmount += targetUnit.defDebuff;
            totalBuffAmount += targetUnit.resDebuff;
        }
            break;
        default: {
            let buffAmount = getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
            buffAmount = getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
            buffAmount = getDefBuffAmount(assistUnit.support) - targetUnit.defBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
            buffAmount = getResBuffAmount(assistUnit.support) - targetUnit.resBuff;
            if (buffAmount > 0) {
                totalBuffAmount += buffAmount;
            }
        }
            break;
    }
    return totalBuffAmount;
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

/// Tier 1 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
// noinspection JSUnusedLocalSymbols
function isDebufferTier1(attackUnit, targetUnit) {
    return attackUnit.weapon === Weapon.Hlidskjalf;
}

/// Tier 2 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
function isDebufferTier2(attackUnit, targetUnit) {
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

function canRefreshTo(targetUnit) {
    return !targetUnit.hasRefreshAssist && targetUnit.isActionDone;
}
