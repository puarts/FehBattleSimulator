/* global CombatResultType, AssistType, isRallyHealSkill, isRallyUp, calcHealAmount, calcBuffAmount, Support */

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

        /** @type {CombatResultType[]} **/
        this.combatResults = [];

        /** @type {CombatResult[]} **/
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
        this.combatResult = CombatResultType.Draw;
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
