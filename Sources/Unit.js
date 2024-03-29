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
        this.hasStatAndNonstatDebuff = 0;
    }

    calcAssistTargetPriority(assistUnit, isPrecombat = true) {
        switch (assistUnit.supportInfo.assistType) {
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
        this.hasStatAndNonstatDebuff = 0;
        if (assistUnit.support === Support.HarshCommandPlus) {
            // 一喝+は弱化と状態異常の両方が付与されてるユニットが最優先
            if (this.targetUnit.hasStatDebuff() && this.targetUnit.hasNonstatDebuff()) {
                this.hasStatAndNonstatDebuff = 1;
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

        return this.hasStatAndNonstatDebuff * 1000000
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

/// ユニットのインスタンス
class Unit extends BattleMapElement {
    constructor(id = "", name = "",
                unitGroupType = UnitGroupType.Ally, moveType = MoveType.Infantry,
                icon = "") {
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

        /** @type {number} */
        this.slotOrder = 0;

        this.weaponRefinement = WeaponRefinementType.None;
        this.summonerLevel = SummonerLevel.None; // 絆レベル
        this.merge = 0; // 限界突破数
        this.dragonflower = 0; // 神竜の花
        this.emblemHeroMerge = 0; // 紋章士の限界突破
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
        this.reservedStatusEffects = [];
        this.currentStatusEffectSet = new Set();
        this.reservedStatusEffectToDeleteSet = new Set();
        this.reservedAtkBuff = 0;
        this.reservedSpdBuff = 0;
        this.reservedDefBuff = 0;
        this.reservedResBuff = 0;
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
        this.reservedSpecialCount = 0;
        this.reservedStatusesToDelete = [false, false, false, false];

        this.tmpSpecialCount = 0; // ダメージ計算で使う奥義カウント
        this.weaponType = WeaponType.None;
        this.specialCount = 0;
        this.maxSpecialCount = 0;

        this._maxHpWithSkills = 0;
        this.hpAdd = 0;
        this.hpMult = 1.0;
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
        // このターン戦闘を行なったか
        this.isCombatDone = false;
        this.isBonusChar = false;

        this.statusEffects = [];
        // TODO: 何に使用しているか調べる
        // noinspection JSUnusedGlobalSymbols
        this.bonuses = [];

        this.perTurnStatuses = [];
        this.distanceFromClosestEnemy = -1;

        this.weaponInfo = null;
        this.supportInfo = null;
        this.specialInfo = null;

        /** @type {SkillInfo} */
        this.passiveAInfo = null;
        this.passiveBInfo = null;
        this.passiveCInfo = null;
        this.passiveSInfo = null;
        this.passiveXInfo = null;
        /** @type {SkillInfo} */
        this.captainInfo = null;

        this.partnerHeroIndex = 0;
        this.emblemHeroIndex = 0;
        this.partnerLevel = PartnerLevel.None; // 支援レベル

        this.isTransformed = false; // 化身
        this.isResplendent = false; // 神装化

        this.isEnemyActionTriggered = false; // 敵AIが行動開始したかどうか

        this.movementOrder = 0;

        // 双界で護衛が初期位置に戻るのに必要
        this.initPosX = 0;
        this.initPosY = 0;

        // 元の場所に再移動の際に使用
        this.fromPosX = 0;
        this.fromPosY = 0;

        // 迅雷やノヴァの聖戦士が発動したかを記録しておく
        this.isOneTimeActionActivatedForWeapon = false;
        this.isOneTimeActionActivatedForWeapon2 = false;
        this.isOneTimeActionActivatedForSpecial = false;
        this.isOneTimeActionActivatedForSupport = false;
        this.isOneTimeActionActivatedForPassiveB = false;
        this.isOneTimeActionActivatedForShieldEffect = false;
        this.isOneTimeActionActivatedForFallenStar = false;
        this.isOneTimeActionActivatedForDeepStar = false;

        // バックアップ
        this.tilesMapForDivineVein = new Map();

        // 奥義に含まれるマップに1回の効果が発動したかを記憶しておく
        this.isOncePerMapSpecialActivated = false;

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
        this.passiveXSp = 0;

        // 攻撃可能なタイル
        this.movableTiles = [];
        this.attackableTiles = [];
        this.assistableTiles = [];
        this.teleportOnlyTiles = [];

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

        this.moveCountForCanto = 0; // 再移動の移動マス数
        this.isCantoActivatedInCurrentTurn = false; // 現在ターンで再移動が1度でも発動したかどうか
        this.isCantoActivating = false; // 再移動中かどうか

        // ロキの盤上遊戯で一時的に限界突破を変える必要があるので、元の限界突破数を記録する用
        this.originalMerge = 0;
        this.originalDragonflower = 0;

        this.warFundsCost; // ロキの盤上遊戯で購入に必要な軍資金

        this.originalTile = null; // 護り手のように一時的に移動する際に元の位置を記録しておく用

        this.restMoveCount = 0; // 再移動(残り)で参照する残り移動量

        this.restWeaponSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない
        this.restSupportSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない
        this.restPassiveBSkillAvailableTurn = 0; // 「その後」以降の効果は、その効果が発動後Nターンの間発動しない

        this.nameWithGroup = "";
        this.__updateNameWithGroup();
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

    get fromPos() {
        return [this.fromPosX, this.fromPosY];
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
        return this.partnerHeroIndex === ally.heroIndex || ally.partnerHeroIndex === this.heroIndex;
    }

    canActivateCanto() {
        return !(!this.isActionDone || this.isCantoActivatedInCurrentTurn);
    }

    /// 再移動が発動可能なら発動します。
    activateCantoIfPossible(moveCountForCanto, cantoControlledIfCantoActivated) {
        if (!this.isActionDone || this.isCantoActivatedInCurrentTurn) {
            return;
        }

        this.moveCountForCanto = moveCountForCanto;

        if (this.isCantoActivated()) {
            this.isActionDone = false;
            this.isCantoActivatedInCurrentTurn = true;
            if (cantoControlledIfCantoActivated) {
                this.addStatusEffect(StatusEffectType.CantoControl);
                this.moveCountForCanto = this.calcMoveCountForCanto();
                if (this.isRangedWeaponType()) {
                    this.endAction();
                    this.deactivateCanto();
                }
            }
            // 再移動発動直後スキル
            for (let skillId of this.enumerateSkills()) {
                let funcMap = applySkillsAfterCantoActivatedFuncMap;
                if (funcMap.has(skillId)) {
                    let func = funcMap.get(skillId);
                    if (typeof func === "function") {
                        func.call(this, moveCountForCanto, cantoControlledIfCantoActivated);
                    } else {
                        console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                    }
                }
            }
            // 同時タイミングに付与された天脈を消滅させる
            g_appData.map.applyReservedDivineVein();
        }
    }

    /// 再移動の発動を終了します。
    deactivateCanto() {
        this.moveCountForCanto = 0;
        this.isCantoActivating = false;
    }

    /// 再移動が発動しているとき、trueを返します。
    isCantoActivated() {
        return this.isCantoActivating;
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

    /// 攻撃可能なユニットを列挙します。
    * enumerateAttackableUnits() {
        for (let tile of this.attackableTiles) {
            if (tile.placedUnit != null && tile.placedUnit.groupId !== this.groupId) {
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
            + ValueDelimiter + boolToInt(this.isOncePerMapSpecialActivated)
            + ValueDelimiter + boolToInt(this.isAttackDone)
            + ValueDelimiter + boolToInt(this.isCantoActivating)
            + ValueDelimiter + this.fromPosX
            + ValueDelimiter + this.fromPosY
            + ValueDelimiter + boolToInt(this.isCombatDone)
            + ValueDelimiter + this.restWeaponSkillAvailableTurn
            + ValueDelimiter + this.restSupportSkillAvailableTurn
            + ValueDelimiter + this.restPassiveBSkillAvailableTurn
            ;
    }

    /**
     * @param  {String} value
     */
    fromTurnWideStatusString(value) {
        if (!value) {
            return;
        }
        let splited = value.split(ValueDelimiter);
        let elemCount = splited.length;
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) {
            this.heroIndex = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.weapon = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.support = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.special = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveA = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveB = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveC = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveS = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing1 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing2 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing3 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.merge = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.dragonflower = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.emblemHeroMerge = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.ivHighStat = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.ivLowStat = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.summonerLevel = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.isBonusChar = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.weaponRefinement = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.partnerHeroIndex = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.emblemHeroIndex = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.partnerLevel = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.slotOrder = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing4 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.hpAdd = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.atkAdd = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.spdAdd = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.defAdd = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.resAdd = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing5 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.grantedBlessing = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.isResplendent = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.level = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.rarity = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.initPosX = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.initPosY = Number(splited[i]);
            ++i;
        }
        if (Number.isFinite(Number(splited[i]))) {
            this.hpMult = Number(splited[i]);
            ++i;
        }
        if (Number.isFinite(Number(splited[i]))) {
            this.atkMult = Number(splited[i]);
            ++i;
        }
        if (Number.isFinite(Number(splited[i]))) {
            this.spdMult = Number(splited[i]);
            ++i;
        }
        if (Number.isFinite(Number(splited[i]))) {
            this.defMult = Number(splited[i]);
            ++i;
        }
        if (Number.isFinite(Number(splited[i]))) {
            this.resMult = Number(splited[i]);
            ++i;
        }
        if (Number.isFinite(Number(splited[i]))) {
            this.defGrowthRate = Number(splited[i]);
            ++i;
        }
        if (Number.isFinite(Number(splited[i]))) {
            this.resGrowthRate = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing6 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.ascendedAsset = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.captain = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveX = Number(splited[i]);
            ++i;
        }
        if (i < elemCount) {
            this.__setPairUpUnitFromCompressedUri(splited[i]);
            ++i;
        }
    }

    __setPairUpUnitFromCompressedUri(settingText) {
        this.__createPairUpUnitInstance();
        if (settingText === "0") {
            return;
        }

        let decompressed = LZString.decompressFromEncodedURIComponent(settingText);
        this.pairUpUnit.fromTurnWideStatusString(decompressed);
    }

    fromPerTurnStatusString(value) {
        if (!value) {
            return;
        }
        let splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) {
            this.ownerType = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.posX = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.posY = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.isActionDone = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.hp = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.atkBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.spdBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.defBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.resBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.atkDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.spdDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.defDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.resDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this._moveCount = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.specialCount = Number(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.setStatusEffectsFromString(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isTransformed = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForSpecial = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isDuoOrHarmonicSkillActivatedInThisTurn = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.duoOrHarmonizedSkillActivationCount = Number(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForSupport = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForPassiveB = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.moveCountAtBeginningOfTurn = Number(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForWeapon = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForWeapon2 = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isEnemyActionTriggered = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForShieldEffect = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.setPerTurnStatusesFromString(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.distanceFromClosestEnemy = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.movementOrder = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.moveCountForCanto = Number(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isCantoActivatedInCurrentTurn = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForFallenStar = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOneTimeActionActivatedForDeepStar = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.restMoveCount = Number(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isOncePerMapSpecialActivated = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isAttackDone = intToBool(Number(splited[i]));
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isCantoActivating = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.fromPosX = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.fromPosY = Number(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isCombatDone = intToBool(Number(splited[i]));
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.restWeaponSkillAvailableTurn = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.restSupportSkillAvailableTurn = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.restPassiveBSkillAvailableTurn = Number(splited[i]);
            ++i;
        }
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
            ;
    }

    fromString(value) {
        let splited = value.split(ValueDelimiter);

        let i = 0;
        if (Number.isInteger(Number(splited[i]))) {
            this.ownerType = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.posX = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.posY = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.heroIndex = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.weapon = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.support = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.special = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveA = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveB = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveC = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveS = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing1 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing2 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.blessing3 = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.merge = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.dragonflower = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.emblemHeroMerge = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.ivHighStat = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.ivLowStat = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.summonerLevel = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.isBonusChar = toBoolean(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.weaponRefinement = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.isActionDone = toBoolean(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.hp = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.atkBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.spdBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.defBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.resBuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.atkDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.spdDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.defDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.resDebuff = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this._moveCount = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.specialCount = Number(splited[i]);
            ++i;
        }
        this.setStatusEffectsFromString(splited[i]);
        ++i;
        if (Number.isInteger(Number(splited[i]))) {
            this.partnerHeroIndex = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.emblemHeroIndex = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.partnerLevel = Number(splited[i]);
            ++i;
        }
        if (splited[i] !== undefined) {
            this.isTransformed = toBoolean(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.slotOrder = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.isResplendent = toBoolean(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.moveCountAtBeginningOfTurn = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.level = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.rarity = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.initPosX = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.initPosY = Number(splited[i]);
            ++i;
        }
        if (Number.isInteger(Number(splited[i]))) {
            this.passiveX = Number(splited[i]);
            ++i;
        }
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

    /// 防衛神階かどうかを取得します。
    get isDefenseMythicHero() {
        return this.providableBlessingSeason === SeasonType.Anima
            || this.providableBlessingSeason === SeasonType.Dark;
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

    addBlessing() {
        if (this.blessingCount === 5) {
            return;
        }
        ++this.blessingCount;
    }

    removeBlessing() {
        if (this.blessingCount === 1) {
            return;
        }
        --this.blessingCount;
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
        if (this.statusEffects.length === 0) {
            return "なし";
        }
        let result = "";
        for (let statusEffect of this.statusEffects) {
            result += getKeyByValue(StatusEffectType, statusEffect) + " ";
        }
        return result.substring(0, result.length - 1);
    }

    /**
     * 状態変化のシリアライズ用の文字列を取得します。
     */
    statusEffectsToString() {
        if (this.statusEffects.length === 0) {
            return String(StatusEffectType.None);
        }
        let result = "";
        for (let statusEffect of this.statusEffects) {
            result += statusEffect + ArrayValueElemDelimiter;
        }
        return result.substring(0, result.length - 1);
    }

    setStatusEffectsFromString(value) {
        this.statusEffects = [];
        if (value == null) {
            return;
        }
        if (Number(value) === StatusEffectType.None) {
            return;
        }
        for (let valueStr of value.split(ArrayValueElemDelimiter)) {
            if (valueStr === "") {
                continue;
            }
            let statusEffect = Number(valueStr);
            if (Number.isInteger(statusEffect)) {
                this.addStatusEffect(statusEffect);
            }
        }
    }

    addAllSpur(amount) {
        let amountNum = Number(amount);
        this.atkSpur += amountNum;
        this.spdSpur += amountNum;
        this.defSpur += amountNum;
        this.resSpur += amountNum;
    }

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

    get isHarmonicHero() {
        return this.heroInfo != null
            && (
                this.heroIndex === Hero.SummerMia
                || this.heroIndex === Hero.PirateVeronica
                || this.heroIndex === Hero.HaloweenTiki
            );
    }

    get isDuoHero() {
        let isDuo = Object.values(Hero).includes(this.heroIndex);
        return this.heroInfo != null && isDuo;
    }

    /**
     * 出典を返す。
     * @return {[String]}
     */
    getOrigins() {
        let info = this.heroInfo;
        if (info === null) return [];
        return info.origin.split('|');
    }

    /**
     * 出典の集合を返す。
     * @param {[Unit]} units
     * @return {Set<String>}
     */
    static getOriginSet(units) {
        /** @type {Set<String>} */
        let originSet = new Set();
        for (let unit of units) {
            for (let origin of unit.getOrigins()) {
                if (origin.indexOf("紋章の謎") >= 0) {
                    originSet.add("紋章の謎");
                } else {
                    originSet.add(origin);
                }
            }
        }
        return originSet;
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

    get buffs() {
        if (this.isPanicEnabled) {
            return [-this.atkBuff, -this.spdBuff, -this.defBuff, -this.resBuff];
        }
        return [this.atkBuff, this.spdBuff, this.defBuff, this.resBuff];
    }

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

    reserveToClearNegativeStatusEffects() {
        this.getNegativeStatusEffects().forEach(e => this.reservedStatusEffectToDeleteSet.add(e));
    }

    clearNegativeStatusEffects() {
        let negativeStatusEffects = this.getNegativeStatusEffects();
        this.statusEffects = this.getPositiveStatusEffects();
        if (negativeStatusEffects.includes(StatusEffectType.Schism)) {
            this.clearPositiveStatusEffect(StatusEffectType.TriangleAttack);
            this.clearPositiveStatusEffect(StatusEffectType.DualStrike);
            this.clearPositiveStatusEffect(StatusEffectType.Pathfinder);
        }
    }

    clearPositiveStatusEffect(statusEffect) {
        if (statusEffect === StatusEffectType.GrandStrategy &&
            this.statusEffects.includes(StatusEffectType.GrandStrategy)) {
            this.resetDebuffs();
        }
        this.statusEffects = this.statusEffects.filter(se => se !== statusEffect)
    }

    clearPositiveStatusEffects() {
        if (this.statusEffects.includes(StatusEffectType.GrandStrategy)) {
            this.resetDebuffs();
        }
        this.statusEffects = this.getNegativeStatusEffects();
    }

    // 弱化以外の状態異常が付与されているか
    hasNonstatDebuff() {
        for (let effect of this.statusEffects) {
            if (isNegativeStatusEffect(effect)) {
                return true;
            }
        }
        return false;
    }

    // 弱化が付与されているか
    hasStatDebuff() {
        if ((!this.battleContext.invalidatesOwnAtkDebuff && this.atkDebuff < 0)
            || (!this.battleContext.invalidatesOwnSpdDebuff && this.spdDebuff < 0)
            || (!this.battleContext.invalidatesOwnResDebuff && this.resDebuff < 0)
            || (!this.battleContext.invalidatesOwnDefDebuff && this.defDebuff < 0)
        ) {
            return true;
        }
    }

    // 状態異常が付与されているか
    hasNegativeStatusEffect() {
        return this.hasNonstatDebuff() || this.hasStatDebuff();
    }

    hasPositiveStatusEffect(enemyUnit = null) {
        for (let effect of this.statusEffects) {
            if (isPositiveStatusEffect(effect)) {
                return true;
            }
        }

        if (enemyUnit != null) {
            if ((!enemyUnit.battleContext.invalidatesAtkBuff && this.atkBuff > 0)
                || (!enemyUnit.battleContext.invalidatesSpdBuff && this.spdBuff > 0)
                || (!enemyUnit.battleContext.invalidatesResBuff && this.resBuff > 0)
                || (!enemyUnit.battleContext.invalidatesDefBuff && this.defBuff > 0)
            ) {
                return true;
            }
        } else {
            return this.atkBuff > 0 ||
                this.spdBuff > 0 ||
                this.defBuff > 0 ||
                this.resBuff > 0;
        }

        return false;
    }

    __getPositiveStatusEffects(statusEffects) {
        let result = [];
        for (let effect of statusEffects) {
            if (isPositiveStatusEffect(effect)) {
                result.push(effect);
            }
        }
        return result;
    }

    getPositiveStatusEffects() {
        return this.__getPositiveStatusEffects(this.statusEffects);
    }

    getNegativeStatusEffects() {
        let result = [];
        for (let effect of this.statusEffects) {
            if (isNegativeStatusEffect(effect)) {
                result.push(effect);
            }
        }
        return result;
    }

    /**
     * @param  {number} statusEffectType
     */
    addStatusEffect(statusEffectType) {
        if (this.hasStatusEffect(statusEffectType)) {
            return;
        }
        this.statusEffects.push(statusEffectType);
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
        return this.statusEffects.length > 0;
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
        for (let statusEffect of this.statusEffects) {
            if (statusEffect === statusEffectType) {
                return true;
            }
        }
        return false;
    }

    isNextTo(unit) {
        let dist = Math.abs(this.posX - unit.posX) + Math.abs(this.posY - unit.posY);
        return dist === 1;
    }

    getActualAttackRange(attackTargetUnit) {
        if (this.isCantoActivated()) {
            return 0;
        }

        return calcDistance(this.posX, this.posY, attackTargetUnit.posX, attackTargetUnit.posY);
    }

    /// すり抜けを発動可能ならtrue、そうでなければfalseを返します。
    canActivatePass() {
        return (this.passiveB === PassiveB.Surinuke3 && this.hpPercentage >= 25)
            || (this.weapon === Weapon.FujinYumi && !this.isWeaponRefined && this.hpPercentage >= 50);
    }

    /// 2マス以内の敵に進軍阻止を発動できるならtrue、そうでなければfalseを返します。
    canActivateObstractToTilesIn2Spaces(moveUnit) {
        let hasSkills = false;
        for (let skillId of this.enumerateSkills()) {
            let funcMap = canActivateObstructToTilesIn2SpacesFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    if (func.call(this, this, moveUnit)) {
                        hasSkills = true;
                        break;
                    }
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
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
    canActivateObstractToAdjacentTiles(moveUnit) {
        let hasSkills = false;
        for (let skillId of this.enumerateSkills()) {
            let funcMap = canActivateObstructToAdjacentTilesFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    if (func.call(this, this, moveUnit)) {
                        hasSkills = true;
                        break;
                    }
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
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
        if (this.isPanicEnabled) {
            return false;
        }
        return this.atkBuff > 0 ||
            this.spdBuff > 0 ||
            this.defBuff > 0 ||
            this.resBuff > 0;
    }

    // 強化無効を考慮
    isBuffedInCombat(enemyUnit) {
        if (this.isPanicEnabled) {
            return false;
        }
        return this.getAtkBuffInCombat(enemyUnit) > 0 ||
            this.getSpdBuffInCombat(enemyUnit) > 0 ||
            this.getDefBuffInCombat(enemyUnit) > 0 ||
            this.getResBuffInCombat(enemyUnit) > 0;
    }

    get isDebuffed() {
        return this.atkDebuff < 0 ||
            this.spdDebuff < 0 ||
            this.defDebuff < 0 ||
            this.resDebuff < 0;
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
        this.isTransformed = false;
        this.setMoveCountFromMoveType();
        this.resetBuffs();
        this.resetDebuffs();
        this.statusEffects = [];
        this.duoOrHarmonizedSkillActivationCount = 0;
        this.isDuoOrHarmonicSkillActivatedInThisTurn = false;
        this.initPosX = this.posX;
        this.initPosY = this.posY;
        this.fromPosX = this.posX;
        this.fromPosY = this.posY;
        this.isEnemyActionTriggered = this.groupId !== UnitGroupType.Enemy;
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
    }

    /**
     * @param  {Unit} enemyUnit
     */
    getAtkIncrementInCombat(enemyUnit) {
        return this.getAtkInCombat(enemyUnit) - this.getAtkInPrecombat();
    }

    /**
     * @param  {Unit} enemyUnit
     */
    getSpdIncrementInCombat(enemyUnit) {
        return this.getSpdInCombat(enemyUnit) - this.getSpdInPrecombat();
    }

    /**
     * @param  {Unit} enemyUnit
     */
    getDefIncrementInCombat(enemyUnit) {
        return this.getDefInCombat(enemyUnit) - this.getDefInPrecombat();
    }

    /**
     * @param  {Unit} enemyUnit
     */
    getResIncrementInCombat(enemyUnit) {
        return this.getResInCombat(enemyUnit) - this.getResInPrecombat();
    }


    resetBuffs() {
        this.atkBuff = 0;
        this.spdBuff = 0;
        this.defBuff = 0;
        this.resBuff = 0;
    }

    reserveToResetDebuffs() {
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
    }

    resetDebuffs() {
        this.atkDebuff = 0;
        this.spdDebuff = 0;
        this.defDebuff = 0;
        this.resDebuff = 0;
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
        this.isCantoActivatedInCurrentTurn = false;
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
            let funcMap = setOnetimeActionActivatedFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
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
        this.resetBuffs();
        this.setMoveCountFromMoveType();
        this.clearPositiveStatusEffects();
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
        if (!this.hasStatusEffect(StatusEffectType.GrandStrategy)) {
            this.resetDebuffs();
        }
        this.clearNegativeStatusEffects();
    }

    applyEndActionSkills() {
        // ユニットが死んだ場合は発動しないはず
        // TODO: 今後死後に発動する効果を持つスキルが実装されたら修正する
        if (this.isDead) {
            return;
        }

        // ここでは天脈の予約を行う
        // 同時タイミングに異なる複数の天脈が付与されていなければ天脈付与を確定させる
        for (let skillId of this.enumerateSkills()) {
            let funcMap = applyEndActionSkillsFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    func.call(this);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
            switch (skillId) {
                case Weapon.Vallastone:
                    for (let tile of g_appData.map.enumerateTilesWithinSpecifiedDistance(this.placedTile, 2)) {
                        tile.reserveDivineVein(DivineVeinType.Stone, this.groupId);
                    }
                    break;
            }
        }

        // 同時タイミングに付与された天脈を消滅させる
        g_appData.map.applyReservedDivineVein();
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
        {
            let value = unit.getSpdInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Spd];
                maxValue = value;
            } else if (value === maxValue) {
                maxStatuses.push(StatusType.Spd);
            }
        }
        {
            let value = unit.getDefInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Def];
                maxValue = value;
            } else if (value === maxValue) {
                maxStatuses.push(StatusType.Def);
            }
        }
        {
            let value = unit.getResInPrecombat();
            if (value > maxValue) {
                maxStatuses = [StatusType.Res];
                // noinspection JSUnusedAssignment
                maxValue = value;
            } else if (value === maxValue) {
                maxStatuses.push(StatusType.Res);
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
        this.applyResBuff(def);
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
        if (this.specialCount >= this.maxSpecialCount) {
            this.specialCount = this.maxSpecialCount;
        }
        if (this.specialCount < 0) {
            this.specialCount = 0;
        }
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
        if (this.specialCount > Number(this.maxSpecialCount)) {
            this.specialCount = Number(this.maxSpecialCount);
        } else if (Number(this.specialCount) < 0) {
            this.specialCount = 0;
        }
    }

    increaseSpecialCount(amount) {
        this.specialCount = Number(this.specialCount) + amount;
        if (this.specialCount > Number(this.maxSpecialCount)) {
            this.specialCount = Number(this.maxSpecialCount);
        }
    }

    reduceSpecialCount(amount) {
        this.specialCount = Number(this.specialCount) - amount;
        if (Number(this.specialCount) < 0) {
            this.specialCount = 0;
        }
    }

    reduceSpecialCountToZero() {
        this.specialCount = 0;
    }

    get currentDamage() {
        return this.maxHpWithSkills - this.hp;
    }

    initReservedHp() {
        this.reservedDamage = 0;
        this.reservedHeal = 0;
    }

    initReservedStatusEffects() {
        this.reservedStatusEffects = [];
        // 現在付与されているステータス(this.statusEffects)を保存する（シーフなどによる解除対象と対象外の付与予約を区別するため）
        this.currentStatusEffectSet = new Set();
        this.statusEffects.forEach(e => this.currentStatusEffectSet.add(e));
    }

    initReservedDebuffs() {
        this.reservedAtkDebuff = this.atkDebuff;
        this.reservedSpdDebuff = this.spdDebuff;
        this.reservedDefDebuff = this.defDebuff;
        this.reservedResDebuff = this.resDebuff;
    }

    applyReservedBuffs() {
        this.applyBuffs(this.reservedAtkBuff, this.reservedSpdBuff, this.reservedDefBuff, this.reservedResBuff);

        this.reservedAtkBuff = 0;
        this.reservedSpdBuff = 0;
        this.reservedDefBuff = 0;
        this.reservedResBuff = 0;
    }

    resetReservedBuffs() {
        this.reservedAtkBuff = 0;
        this.reservedSpdBuff = 0;
        this.reservedDefBuff = 0;
        this.reservedResBuff = 0;
    }

    applyReservedDebuffs() {
        this.atkDebuff = this.reservedAtkDebuff;
        this.spdDebuff = this.reservedSpdDebuff;
        this.defDebuff = this.reservedDefDebuff;
        this.resDebuff = this.reservedResDebuff;

        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
    }

    resetReservedDebuffs() {
        this.reservedAtkDebuff = 0;
        this.reservedSpdDebuff = 0;
        this.reservedDefDebuff = 0;
        this.reservedResDebuff = 0;
    }

    applyReservedStatusEffects() {
        // 削除予約を反映
        for (let e of this.reservedStatusEffectToDeleteSet) {
            this.currentStatusEffectSet.delete(e);
        }
        if (this.reservedStatusesToDelete[0]) this.atkBuff = 0;
        if (this.reservedStatusesToDelete[1]) this.spdBuff = 0;
        if (this.reservedStatusesToDelete[2]) this.defBuff = 0;
        if (this.reservedStatusesToDelete[3]) this.resBuff = 0;

        this.reservedStatusEffectToDeleteSet.clear();
        this.reservedStatusesToDelete = [false, false, false, false];
        // すでに付与されている状態（解除は反映済み）に予約された状態を加える
        this.reservedStatusEffects.forEach(e => this.currentStatusEffectSet.add(e));
        this.statusEffects = [...this.currentStatusEffectSet];
        this.reservedStatusEffects = [];
    }

    /**
     * @param  {Boolean} leavesOneHp
     */
    applyReservedHp(leavesOneHp) {
        let healHp = this.hasStatusEffect(StatusEffectType.DeepWounds) ? 0 : this.reservedHeal;
        let damageHp = this.hasStatusEffect(StatusEffectType.EnGarde) ? 0 : this.reservedDamage;
        this.hp = Number(this.hp) - damageHp + healHp;
        this.modifyHp(leavesOneHp);

        this.reservedDamage = 0;
        this.reservedHeal = 0;
    }

    reserveTakeDamage(damageAmount) {
        this.reservedDamage += damageAmount;
    }

    reserveHeal(healAmount) {
        this.reservedHeal += healAmount;
    }

    modifyHp(leavesOneHp = false) {
        if (this.hp > this.maxHpWithSkills) {
            this.hp = this.maxHpWithSkills;
        } else if (this.hp <= 0) {
            if (leavesOneHp) {
                this.hp = 1;
            } else {
                this.hp = 0;
            }
        }
    }

    takeDamage(damageAmount, leavesOneHp = false) {
        if (this.isDead) {
            return;
        }
        let hp = this.hp - damageAmount;
        if (hp < 1) {
            if (leavesOneHp) {
                hp = 1;
            } else {
                hp = 0;
            }
        }
        this.hp = hp;
    }

    healFull() {
        this.heal(99);
    }

    heal(healAmount) {
        if (this.hasStatusEffect(StatusEffectType.DeepWounds)) {
            return 0;
        }

        let damage = this.maxHpWithSkills - this.hp;
        let hp = this.hp + healAmount;
        if (hp > this.maxHpWithSkills) {
            hp = this.maxHpWithSkills;
        }
        this.hp = hp;
        return Math.min(damage, healAmount);
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
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.Heal;
    }

    get hasDonorHealAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.DonorHeal;
    }

    get hasRestoreAssist() {
        return this.supportInfo != null
            && this.supportInfo.assistType === AssistType.Restore;
    }

    get hasRallyAssist() {
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

    /// 戦闘のダメージ計算時の残りHPです。戦闘のダメージ計算のみで使用できます。
    get restHpPercentage() {
        if (this.restHp >= this.maxHpWithSkills) {
            return 100;
        }
        return 100 * this.restHp / this.maxHpWithSkills;
    }

    /// ターン開始時スキルで使用する残りのHP割合です。
    get restHpPercentageAtBeginningOfTurn() {
        if (this.hp >= this.maxHpWithSkills) {
            return 100;
        }
        return 100 * this.hp / this.maxHpWithSkills;
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
        if (this.hasStatusEffect(StatusEffectType.Gravity)) {
            return 1;
        }
        if (this.hasStatusEffect(StatusEffectType.MobilityIncreased)) {
            if (this.hasStatusEffect(StatusEffectType.Stall)) {
                return 1;
            }
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
    getWeaponName() {
        if (this.weaponInfo == null) {
            return "‐";
        }
        return this.weaponInfo.name;
    }

    /// 装備中のAスキル名を取得します。
    getPassiveAName() {
        if (this.passiveAInfo == null) {
            return "‐";
        }
        return this.passiveAInfo.name;
    }

    /// 装備中の聖印名を取得します。
    getPassiveSName() {
        if (this.passiveSInfo == null) {
            return "‐";
        }
        return this.passiveSInfo.name;
    }

    /// 装備中の聖印名を取得します。
    getPassiveXName() {
        if (this.passiveXInfo == null) {
            return "‐";
        }
        return this.passiveXInfo.name;
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
        if (!this.canNullPanic() && this.hasPanic) {
            return -1;
        }
        return 1;
    }

    canNullPanic() {
        return this.hasStatusEffect(StatusEffectType.NullPanic);
    }

    getSpdInPrecombatWithoutDebuff() {
        return Number(this.spdWithSkills) + Number(this.spdBuff) * this.__getBuffMultiply();
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
        return Number(this.atkWithSkills) + Number(this.atkBuff) * this.__getBuffMultiply();
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
        let invalidates = enemyUnit !== null &&
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

    getStatusesInCombat(enemyUnit = null) {
        return [
            this.getAtkInCombat(enemyUnit),
            this.getSpdInCombat(enemyUnit),
            this.getDefInCombat(enemyUnit),
            this.getResInCombat(enemyUnit),
        ];
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
        return (Number(this.atkWithSkills) + this.getAtkDebuffInCombat() + Number(this.atkSpur));
    }

    __getSpdInCombatWithoutBuff() {
        return (Number(this.spdWithSkills) + this.getSpdDebuffInCombat() + Number(this.spdSpur));
    }

    __getDefInCombatWithoutBuff() {
        return (Number(this.defWithSkills) + this.getDefDebuffInCombat() + Number(this.defSpur));
    }

    __getResInCombatWithoutBuff() {
        return (Number(this.resWithSkills) + this.getResDebuffInCombat() + Number(this.resSpur));
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
        return mit + mitBuff;
    }

    getDefInPrecombat() {
        return Math.min(99, this.getDefInPrecombatWithoutDebuff() + Number(this.defDebuff));
    }

    getResInPrecombatWithoutDebuff() {
        let mit = Number(this.resWithSkills);
        let mitBuff = Number(this.resBuff) * this.__getBuffMultiply();
        return mit + mitBuff;
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

    __getEvalDefAdd() {
        switch (this.passiveS) {
            default:
                return 0;
        }
    }

    __getEvalResAdd() {
        let value = getEvalResAdd(this.passiveS);
        if (value) {
            return value;
        }
        return 0;
    }

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
                this._maxHpWithSkills += 5;
                this.atkWithSkills += 3;
                break;
            case BlessingType.Hp5_Spd4:
                this._maxHpWithSkills += 5;
                this.spdWithSkills += 4;
                break;
            case BlessingType.Hp5_Def5:
                this._maxHpWithSkills += 5;
                this.defWithSkills += 5;
                break;
            case BlessingType.Hp5_Res5:
                this._maxHpWithSkills += 5;
                this.resWithSkills += 5;
                break;
            case BlessingType.Hp3_Atk2:
                this._maxHpWithSkills += 3;
                this.atkWithSkills += 2;
                break;
            case BlessingType.Hp3_Spd3:
                this._maxHpWithSkills += 3;
                this.spdWithSkills += 3;
                break;
            case BlessingType.Hp3_Def4:
                this._maxHpWithSkills += 3;
                this.defWithSkills += 4;
                break;
            case BlessingType.Hp3_Res4:
                this._maxHpWithSkills += 3;
                this.resWithSkills += 4;
                break;
            case BlessingType.Hp3:
                this._maxHpWithSkills += 3;
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
    calcAssetStatusIncrement(growthRate) {
        return this.__calcGrowthValue(growthRate + 0.05) - this.__calcGrowthValue(growthRate) + 1;
    }

    /// 入力した成長率に対して、不得意ステータスの減少値を取得します。
    calcFlowStatusDecrement(growthRate) {
        return this.__calcGrowthValue(growthRate - 0.05) - this.__calcGrowthValue(growthRate) - 1;
    }

    updateStatusByMergeAndDragonFlower() {
        const addValues = Unit.calcStatusAddValuesByMergeAndDragonFlower(
            this.ivHighStat, this.ivLowStat, this.ascendedAsset,
            this.merge, this.dragonflower, this.emblemHeroMerge,
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

    /**
     * 限界突破と神竜の花によるステータス加算を計算する。
     * 限界突破にはエンゲージされた紋章士の凸数も含む
     * @param  {number} ivHighStat
     * @param  {number} ivLowStat
     * @param  {number} ascendedAsset
     * @param  {number} merge
     * @param  {number} dragonflower
     * @param  {number} emblemHeroMerge
     * @param  {number} hpLv1
     * @param  {number} atkLv1
     * @param  {number} spdLv1
     * @param  {number} defLv1
     * @param  {number} resLv1
     */
    static calcStatusAddValuesByMergeAndDragonFlower(
        ivHighStat, ivLowStat, ascendedAsset,
        merge, dragonflower, emblemHeroMerge,
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
        if (merge > 0 || dragonflower > 0 || emblemHeroMerge) {
            const statusList = [
                {type: StatusType.Hp, value: hpLv1 + hpLv1IvChange},
                {type: StatusType.Atk, value: atkLv1 + atkLv1IvChange},
                {type: StatusType.Spd, value: spdLv1 + spdLv1IvChange},
                {type: StatusType.Def, value: defLv1 + defLv1IvChange},
                {type: StatusType.Res, value: resLv1 + resLv1IvChange},
            ];
            statusList.sort((a, b) => {
                return b.value - a.value;
            });
            const updateStatus = (statItr) => {
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
            };

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
                updateStatus(statItr);
                statItr += 1;
                updateStatus(statItr);
                statItr += 1;
            }

            // 神竜の花
            for (let i = 0; i < dragonflower; ++i) {
                updateStatus(i);
            }

            // 紋章士の限界突破
            for (let i = 0; i < emblemHeroMerge; ++i) {
                updateStatus(i);
            }
        }

        return addValues;
    }

    canHeal(requiredHealAmount = 1) {
        if (this.hasStatusEffect(StatusEffectType.DeepWounds)) {
            return false;
        }

        return this.currentDamage >= requiredHealAmount;
    }

    * enumerateSkillInfos() {
        if (this.weaponInfo != null) {
            yield this.weaponInfo;
        }
        if (this.supportInfo != null) {
            yield this.supportInfo;
        }
        if (this.specialInfo != null) {
            yield this.specialInfo;
        }
        if (this.passiveAInfo != null) {
            yield this.passiveAInfo;
        }
        if (this.passiveBInfo != null) {
            yield this.passiveBInfo;
        }
        if (this.passiveCInfo != null) {
            yield this.passiveCInfo;
        }
        if (this.passiveSInfo != null) {
            yield this.passiveSInfo;
        }
        if (this.passiveXInfo != null) {
            yield this.passiveXInfo;
        }
        if (this.isCaptain && this.captainInfo != null) {
            yield this.captainInfo;
        }
    }

    * enumerateSkills() {
        if (this.weapon !== NoneValue) {
            yield this.weapon;
        }
        if (this.support !== NoneValue) {
            yield this.support;
        }
        if (this.special !== NoneValue) {
            yield this.special;
        }
        if (this.passiveA !== NoneValue) {
            yield this.passiveA;
        }
        if (this.passiveB !== NoneValue) {
            yield this.passiveB;
        }
        if (this.passiveC !== NoneValue) {
            yield this.passiveC;
        }
        if (this.passiveS !== NoneValue) {
            yield this.passiveS;
        }
        if (this.passiveX !== NoneValue) {
            yield this.passiveX;
        }
        if (this.isCaptain && this.captain !== NoneValue) {
            yield this.captain;
        }
        if (this.emblemHeroIndex > 0) {
            yield getEmblemHeroSkillId(this.emblemHeroIndex);
        }
    }

    * enumeratePassiveSkills() {
        if (this.passiveA !== NoneValue) {
            yield this.passiveA;
        }
        if (this.passiveB !== NoneValue) {
            yield this.passiveB;
        }
        if (this.passiveC !== NoneValue) {
            yield this.passiveC;
        }
        if (this.passiveS !== NoneValue) {
            yield this.passiveS;
        }
        if (this.passiveX !== NoneValue) {
            yield this.passiveX;
        }
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


    get totalPureGrowthRate() {
        return Number(this.hpGrowthRate)
            + Number(this.atkGrowthRate)
            + Number(this.spdGrowthRate)
            + Number(this.defGrowthRate)
            + Number(this.resGrowthRate);
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

    calcArenaTotalSpScore() {
        return calcArenaTotalSpScore(this.getTotalSp());
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
        // this.passiveS = PassiveS.None;
        // this.passiveX = PassiveX.None;
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
            this.maxHpWithSkillsWithoutAdd += 10;
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
    }

    get hasPairUpUnit() {
        return this.canHavePairUpUnit && this.pairUpUnit != null && this.pairUpUnit.heroInfo != null;
    }

    /// ステータスにスキルの加算値を加算します。
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
            console.error("special ID " + this.special + " was not found.");
            return;
        }

        let specialCountMax = this.specialInfo.specialCount;
        if (this.weaponInfo != null) {
            specialCountMax += this.weaponInfo.cooldownCount;
        }
        for (let skillId of this.enumerateSkills()) {
            let funcMap = resetMaxSpecialCountFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    specialCountMax += func.call(this);
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
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
        if (specialCountMax === 0) {
            specialCountMax = 1;
        }

        this.maxSpecialCount = specialCountMax;
        if (this.specialCount > this.maxSpecialCount) {
            this.specialCount = this.maxSpecialCount;
        }
    }

    /// テレポート系スキルを所持していたり、状態が付与されていて、テレポートが可能な状態かどうかを判定します。
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

    /// 応援や一喝を実行可能かどうかを返します。
    canRallyTo(targetUnit, buffAmountThreshold) {
        let assistUnit = this;
        switch (assistUnit.support) {
            case Support.HarshCommandPlus:
                if (targetUnit.hasNegativeStatusEffect()) {
                    return true;
                }
                return this.__canExecuteHarshCommand(targetUnit);
            case Support.HarshCommand:
                return this.__canExecuteHarshCommand(targetUnit);
            default:
                if ((getAtkBuffAmount(assistUnit.support) - targetUnit.atkBuff) >= buffAmountThreshold) {
                    return true;
                }
                if ((getSpdBuffAmount(assistUnit.support) - targetUnit.spdBuff) >= buffAmountThreshold) {
                    return true;
                }
                if ((getDefBuffAmount(assistUnit.support) - targetUnit.defBuff) >= buffAmountThreshold) {
                    return true;
                }
                // noinspection RedundantIfStatementJS
                if ((getResBuffAmount(assistUnit.support) - targetUnit.resBuff) >= buffAmountThreshold) {
                    return true;
                }
                return false;
        }
    }

    /// 実際に補助可能なユニットとタイルを列挙します。
    * enumerateActuallyAssistableUnitAndTiles() {
        for (let unit of this.enumerateAssistableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist === this.assistRange) {
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

    /// 実際に攻撃可能なユニットとタイルを列挙します。
    * enumerateActuallyAttackableUnitAndTiles() {
        for (let unit of this.enumerateAttackableUnits()) {
            for (let tile of this.enumerateMovableTiles(false)) {
                let dist = tile.calculateDistanceToUnit(unit);
                if (dist === this.attackRange) {
                    yield [unit, tile];
                }
            }
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

    /// 神罰の杖を発動可能か調べます。
    canActivateWrathfulStaff() {
        let atkWeaponInfo = atkUnit.weaponInfo;
        let passiveBInfo = atkUnit.passiveBInfo;

        // 神罰の杖
        return (atkWeaponInfo != null && atkWeaponInfo.wrathfulStaff)
            || (passiveBInfo != null && passiveBInfo.wrathfulStaff)
            || (atkUnit.weaponRefinement === WeaponRefinementType.WrathfulStaff);
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

    /// 指定したユニットの指定した距離以内に自身がいるかどうかを取得します。
    isWithinSpecifiedDistanceFrom(unit, spaces) {
        let diffX = Math.abs(this.posX - unit.posX);
        let diffY = Math.abs(this.posY - unit.posY);
        let dist = diffX + diffY;
        return dist <= spaces;
    }


    /// ユニットが待ち伏せや攻め立てなどの攻撃順変更効果を無効化できるかどうかを判定します。
    canDisableAttackOrderSwapSkill(restHpPercentage, defUnit) {
        for (let skillId of this.enumerateSkills()) {
            let funcMap = canDisableAttackOrderSwapSkillFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    if (func.call(this, restHpPercentage, defUnit)) {
                        return true;
                    }
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
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
        return isPrecombatSpecial(this.special) && Number(this.specialCount) === 0;
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
        for (let skillId of this.enumerateSkills()) {
            let funcMap = calcMoveCountForCantoFuncMap;
            if (funcMap.has(skillId)) {
                let func = funcMap.get(skillId);
                if (typeof func === "function") {
                    moveCountForCanto = Math.max(moveCountForCanto, func.call(this, moveCountForCanto));
                } else {
                    console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
                }
            }
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
                case Weapon.HolytideTyrfing:
                case Weapon.WingLeftedSpear:
                case PassiveB.LunarBrace2:
                case Weapon.NidavellirSprig:
                case Weapon.NidavellirLots:
                case Weapon.GrimBrokkr:
                case Weapon.HonorableBlade:
                case PassiveB.SolarBrace2:
                case PassiveB.MoonlightBangle:
                case Weapon.DolphinDiveAxe:
                case Weapon.Ladyblade:
                case Weapon.FlowerLance:
                case Weapon.BlazingPolearms:
                    moveCountForCanto = Math.max(moveCountForCanto, 2);
                    break;
                // 再移動(3)
                case Weapon.AutoLofnheior:
                    moveCountForCanto = Math.max(moveCountForCanto, 3);
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
            if (SaveSkills.has(skillId)) {
                return true;
            }
        }
        return false;
    }

    // 攻撃した側が動いた距離を返す。0ならユニットは移動していない。
    static calcAttackerMoveDistance(unit1, unit2) {
        let unit = unit1.battleContext.initiatesCombat ? unit1 : unit2;
        if (unit.fromPosX === -1 || unit.fromPosY === -1) {
            return 0;
        }
        return Math.abs(unit.fromPosX - unit.posX) + Math.abs(unit.fromPosY - unit.posY);
    }

    // 移動した距離を返す(移動前と移動後のマスの距離)
    static calcMoveDistance(unit) {
        if (unit.fromPosX === -1 || unit.fromPosY === -1) {
            return 0;
        }
        return Math.abs(unit.fromPosX - unit.posX) + Math.abs(unit.fromPosY - unit.posY);
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

/// @brief 回復補助の回復量を取得します。
/// @param {Unit} assistUnit 補助者のユニット
/// @param {Unit} targetUnit 補助対象のユニット
function calcHealAmount(assistUnit, targetUnit) {
    let healAmount = 0;
    switch (assistUnit.support) {
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
        default:
            return 0;
    }
    if (targetUnit.currentDamage < healAmount) {
        return targetUnit.currentDamage;
    }
    return healAmount;
}

/// Tier 1 のデバッファーであるかどうかを判定します。 https://vervefeh.github.io/FEH-AI/charts.html#chartG
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
        let funcMap = isAfflictorFuncMap;
        if (funcMap.has(skillId)) {
            let func = funcMap.get(skillId);
            if (typeof func === "function") {
                if (func.call(this, attackUnit, lossesInCombat, result)) {
                    return true;
                }
            } else {
                console.warn(`登録された関数が間違っています。key: ${skillId}, value: ${func}, type: ${typeof func}`);
            }
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
