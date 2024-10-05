const UNIT_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は範囲奥義を発動できない`);
        unit.battleContext.cannotTriggerPrecombatSpecial = true;
    }
}();

const FOE_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は範囲奥義を発動できない`);
        unit.battleContext.cannotTriggerPrecombatSpecial = true;
    }
}();

const UNIT_DISABLES_DEFENSIVE_TERRAIN_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は防御地形の効果を無効`);
        unit.battleContext.invalidatesDefensiveTerrainEffect = true;
    }
}();

const FOE_DISABLES_DEFENSIVE_TERRAIN_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は防御地形の効果を無効`);
        unit.battleContext.invalidatesDefensiveTerrainEffect = true;
    }
}();

const UNIT_DISABLES_SUPPORT_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は支援効果を無効`);
        unit.battleContext.invalidatesSupportEffect = true;
    }
}();

const FOE_DISABLES_SUPPORT_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は支援効果を無効`);
        unit.battleContext.invalidatesSupportEffect = true;
    }
}();

class DoesTargetInitiateCombatNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.initiatesCombat;
        env.debug(`${unit.nameWithGroup}から攻撃したか: ${result}`);
        return result;
    }
}

const DOES_TARGET_INITIATE_COMBAT_NODE = new DoesTargetInitiateCombatNode();

class DoesUnitInitiateCombatNode extends DoesTargetInitiateCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const DOES_UNIT_INITIATE_COMBAT_NODE = new DoesUnitInitiateCombatNode();

class DoesFoeInitiateCombatNode extends DoesTargetInitiateCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const DOES_FOE_INITIATE_COMBAT_NODE = new DoesFoeInitiateCombatNode();

class TargetsHpPercentageAtStartOfCombatNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let hpPercentage = unit.battleContext.restHpPercentage;
        env.debug(`${unit.nameWithGroup}の戦闘開始時のHPの割合: ${hpPercentage}`);
        return hpPercentage;
    }
}

class FoesHpPercentageAtStartOfCombatNode extends TargetsHpPercentageAtStartOfCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOES_HP_PERCENTAGE_AT_START_OF_COMBAT_NODE = new FoesHpPercentageAtStartOfCombatNode();

/**
 * @abstract
 */
class PercentageCondNode extends BoolNode {
    _percentage;

    constructor(percentage) {
        super();
        this._percentage = percentage;
    }
}

class IsTargetsHpGteNPercentAtStartOfCombatNode extends PercentageCondNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let hpPercentage = unit.restHpPercentageAtBeginningOfCombat;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以上であるか: ${hpPercentage}%(HP:${unit.battleContext.restHp}) >= ${this._percentage}%`);
        return hpPercentage >= this._percentage;
    }
}

class IsUnitsHpGteNPercentAtStartOfTurnNode extends PercentageCondNode {
    evaluate(env) {
        let unit = env.targetUnit;
        let hpPercentage = unit.restHpPercentageAtBeginningOfTurn;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以上であるか: ${hpPercentage}%(HP:${unit.battleContext.restHp}) >= ${this._percentage}%`);
        return hpPercentage >= this._percentage;
    }
}

const IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE = new IsUnitsHpGteNPercentAtStartOfTurnNode(25);

class IsUnitsHpGteNPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let hpPercentage = unit.battleContext.restHpPercentage;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以上であるか: ${hpPercentage}%(HP:${unit.battleContext.restHp}) >= ${this._percentage}%`);
        return hpPercentage >= this._percentage;
    }
}

const IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE = new IsUnitsHpGteNPercentAtStartOfCombatNode(25);

class IsUnitsHpLteNPercentInCombatNode extends PercentageCondNode {
    evaluate(env) {
        // targetUnit.battleContext.restHpPercentage ではなくこちらが正しい
        let unit = env.unitDuringCombat;
        let hpPercentage = unit.restHpPercentage;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以下であるか: ${hpPercentage}%(HP:${unit.restHp}) <= ${this._percentage}%`);
        return hpPercentage <= this._percentage;
    }
}

const IS_UNITS_HP_LTE_99_PERCENT_IN_COMBAT_NODE = new IsUnitsHpLteNPercentInCombatNode(99);

class IsFoesHpGteNPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        let hpPercentage = unit.battleContext.restHpPercentage;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以上であるか: ${hpPercentage}%(HP:${unit.battleContext.restHp}) >= ${this._percentage}%`);
        return unit.battleContext.restHpPercentage >= this._percentage;
    }
}

const IS_FOES_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE = new IsFoesHpGteNPercentAtStartOfCombatNode(50);
const IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE = new IsFoesHpGteNPercentAtStartOfCombatNode(75);

// 自分の最初の攻撃前に自身の奥義発動カウント-N(符号に注意Nは自然数)
class UnitGrantsSpecialCooldownMinusNToUnitBeforeUnitsFirstAttackNode extends FromPositiveNumberNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.targetUnit;
        unit.battleContext.specialCountReductionBeforeFirstAttack += n;
        let reduction = unit.battleContext.specialCountReductionBeforeFirstAttack;
        env.debug(`${unit.nameWithGroup}は自分の最初の攻撃前に自身の奥義発動カウント-${n}: ${reduction - n} => ${reduction}`);
    }
}

const UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_ATTACK_NODE =
    new UnitGrantsSpecialCooldownMinusNToUnitBeforeUnitsFirstAttackNode(1);

const FOE_CANNOT_COUNTERATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は反撃不可`);
        unit.battleContext.invalidatesCounterattack = true;
    }
}();

/**
 * @abstract
 */
class IsSpecialTriggeredNode extends NumberWithUnitNode {
    /**
     * @param {NodeEnv} env
     * @returns {number}
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.isSpecialActivated;
        env.debug(`${unit.nameWithGroup}は奥義を発動したか: ${result}`)
        return result;
    }
}

const IS_UNITS_SPECIAL_TRIGGERED = new class extends IsSpecialTriggeredNode {
    getUnit(env) {
        return env.unitDuringCombat;
    }
}();

// noinspection JSUnusedGlobalSymbols
const IS_FOES_SPECIAL_TRIGGERED = new class extends IsSpecialTriggeredNode {
    getUnit(env) {
        return env.foeDuringCombat;
    }
}();

const UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        unit.battleContext.followupAttackPriorityIncrement++;
        env.debug(`${unit.nameWithGroup}は絶対追撃: ${unit.battleContext.followupAttackPriorityIncrement}`);
    }
}();

const FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        unit.battleContext.followupAttackPriorityDecrement--;
        env.debug(`${unit.nameWithGroup}は追撃不可: ${unit.battleContext.followupAttackPriorityDecrement}`);
    }
}();

const NULL_UNIT_FOLLOW_UP_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は自身に見切り・追撃`);
        unit.battleContext.setNullFollowupAttack();
    }
}();

const NULL_FOE_FOLLOW_UP_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は自身に見切り・追撃`);
        unit.battleContext.setNullFollowupAttack();
    }
}();

/**
 * neutralizes effects that inflict "Special cooldown charge -X" on unit,
 */
class NeutralizesEffectsThatInflictSpecialCooldownChargeMinusXOnTarget extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        env.debug(`${unit.nameWithGroup}は自身の奥義発動カウント変動量-を無効`);
        unit.battleContext.neutralizesReducesCooldownCount();
    }
}

class NeutralizesEffectsThatInflictSpecialCooldownChargeMinusXOnUnit extends NeutralizesEffectsThatInflictSpecialCooldownChargeMinusXOnTarget {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const NEUTRALIZES_EFFECTS_THAT_INFLICT_SPECIAL_COOLDOWN_CHARGE_MINUS_X_ON_UNIT = new NeutralizesEffectsThatInflictSpecialCooldownChargeMinusXOnUnit();

/**
 * neutralizes effects that grant "Special cooldown charge +X" to foe
 * @type {boolean}
 */
class NeutralizesEffectsThatGrantSpecialCooldownChargePlusXToTarget extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let foe = env.getFoeDuringCombatOf(unit);
        env.debug(`${unit.nameWithGroup}は敵の奥義発動カウント変動量+を無効`);
        foe.battleContext.increaseCooldownCountForAttack = false;
        foe.battleContext.increaseCooldownCountForDefense = false;
    }
}

class NeutralizesEffectsThatGrantSpecialCooldownChargePlusXToFoe extends NeutralizesEffectsThatGrantSpecialCooldownChargePlusXToTarget {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const NEUTRALIZES_EFFECTS_THAT_GRANT_SPECIAL_COOLDOWN_CHARGE_PLUS_X_TO_FOE = new NeutralizesEffectsThatGrantSpecialCooldownChargePlusXToFoe();

// noinspection JSUnusedGlobalSymbols
/**
 * neutralizes effects that guarantee foe's follow-up attacks during combat.
 */
const UNIT_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        unit.battleContext.invalidatesAbsoluteFollowupAttack = true;
        env.debug(`${unit.nameWithGroup}は敵の絶対追撃を無効`);
    }
}

// noinspection JSUnusedGlobalSymbols
/**
 * neutralizes effects that prevent unit's follow-up attacks during combat.
 */
const UNIT_NEUTRALIZES_EFFECTS_THAT_PREVENT_UNITS_FOLLOW_UP_ATTACKS_DURING_COMBAT = new class extends SkillEffectNode {
    evaluate(env) {
        // 自身の追撃不可を無効
        env.unitDuringCombat.battleContext.invalidatesInvalidationOfFollowupAttack = true;
    }
}

/**
 * unit can make a follow-up attack before foe's next attack.
 */
const UNIT_CAN_MAKE_FOLLOW_UP_ATTACK_BEFORE_FOES_NEXT_ATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        // 攻め立て
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}に攻め立て効果を設定`);
        unit.battleContext.isDesperationActivatable = true;
    }
}

const UNIT_DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は反撃不可を無効`);
        unit.battleContext.nullCounterDisrupt = true;
    }
}

const FOE_DISABLES_SKILLS_THAT_PREVENT_COUNTERATTACKS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は反撃不可を無効`);
        unit.battleContext.nullCounterDisrupt = true;
    }
}

const UNIT_CANNOT_TRIGGER_ATTACKER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は戦闘中の攻撃奥義を発動できない`);
        unit.battleContext.preventedAttackerSpecial = true;
    }
}();

const FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は戦闘中の攻撃奥義を発動できない`);
        unit.battleContext.preventedAttackerSpecial = true;
    }
}();

const UNIT_CANNOT_TRIGGER_DEFENDER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は戦闘中の防御奥義を発動できない`);
        unit.battleContext.preventedDefenderSpecial = true;
    }
}();

const FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は戦闘中の防御奥義を発動できない`);
        unit.battleContext.preventedDefenderSpecial = true;
    }
}();

const UNIT_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は戦闘順序入れ替えスキル(待ち伏せ、攻め立て等)無効`);
        unit.battleContext.canUnitDisableSkillsThatChangeAttackPriority = true;
    }
}();

const FOE_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は戦闘順序入れ替えスキル(待ち伏せ、攻め立て等)無効`);
        unit.battleContext.canUnitDisableSkillsThatChangeAttackPriority = true;
    }
}();

/**
 * increases the Spd difference necessary for foe to make a follow-up attack by N during combat
 */
class IncreasesSpdDiffNecessaryForFoesFollowUpNode extends FromPositiveNumberNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        let n = this.evaluateChildren(env);
        unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += n;
        env.debug(`${unit.nameWithGroup}の追撃の速さ条件+${n}: ${unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
    }
}

/**
 * decreases Spd difference necessary for unit to make a follow-up attack by X during combat
 */
class DecreasesSpdDiffNecessaryForUnitFollowUpNode extends FromPositiveNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let n = this.evaluateChildren(env);
        unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack -= n;
        env.debug(`${unit.nameWithGroup}の追撃の速さ条件-${n}: ${unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
    }
}

/**
 * neutralizes penalties to unit's Atk/Spd
 */
class NeutralizesPenaltiesToTargetsStatsNode extends SetBoolToEachStatusNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let values = this.getValues();
        let unit = this.getUnit(env);
        env.debug(`${unit.nameWithGroup}は自身の弱化を無効: [${values}]`);
        unit.battleContext.invalidateOwnDebuffs(...values);
    }
}

class NeutralizesPenaltiesToUnitsStatsNode extends NeutralizesPenaltiesToTargetsStatsNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const NEUTRALIZES_PENALTIES_ON_UNIT_NODE = new NeutralizesPenaltiesToUnitsStatsNode(true, true, true, true);

/**
 * neutralizes foe's bonuses to Spd/Def
 */
class NeutralizesFoesBonusesToStatsDuringCombatNode extends SetBoolToEachStatusNode {
    evaluate(env) {
        let values = this.getValues();
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は相手の強化を無効: [${values}]`);
        unit.battleContext.invalidateBuffs(...values);
    }
}

const NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE = new NeutralizesFoesBonusesToStatsDuringCombatNode(true, true, true, true);

/**
 * number of【Bonus】effects active on unit, excluding stat bonuses + number of【Penalty】effects active on foe, excluding stat penalties
 */
const NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        return env.unitDuringCombat.getPositiveStatusEffects().length + env.foeDuringCombat.getNegativeStatusEffects().length;
    }
}();

const NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let result = unit.getPositiveStatusEffects().length;
        env.debug(`${unit.nameWithGroup}の有利な状態の数: ${result}`);
        return result;
    }
}();

const NUM_OF_PENALTY_ON_UNIT_EXCLUDING_STAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let result = unit.getNegativeStatusEffects().length;
        env.debug(`${unit.nameWithGroup}の不利な状態の数: ${result}`);
        return result;
    }
}();

const NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let result = env.unitDuringCombat.getPositiveStatusEffects().length + env.foeDuringCombat.getPositiveStatusEffects().length;
        env.debug(`自分有利な状態と相手の有利な状態の数: ${result}`);
        return result;
    }
}();

const NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        let result = unit.getNegativeStatusEffects().length;
        env.debug(`${unit.nameWithGroup}の不利な状態の数: ${result}`);
        return result;
    }
}();

class BoostsDamageWhenSpecialTriggersNode extends FromPositiveNumberNode {
    evaluate(env) {
        let unit = env.target;
        let value = this.evaluateChildren(env);
        unit.battleContext.addSpecialAddDamage(value);
        let damage = unit.battleContext.getSpecialAddDamage();
        env.debug(`${unit.nameWithGroup}は奥義ダメージに${value}加算: ${damage - value} => ${damage}`);
    }
}

// noinspection JSUnusedGlobalSymbols
class UnitDealsDamageNode extends ApplyingNumberNode {
    evaluate(env) {
        env.unitDuringCombat.battleContext.additionalDamage += this.evaluateChildren(env);
    }
}

/**
 * TODO: 範囲奥義を除く値を管理する変数をbattleContextに追加する。
 */
class TargetDealsDamageExcludingAoeSpecialsNode extends ApplyingNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    getDescription(n) {
        return `与えるダメージ+${n}`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = this.getUnit(env);
        let context = unit.battleContext;
        let beforeValue = context.additionalDamage;
        context.additionalDamage += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${beforeValue} => ${context.additionalDamage}`);
    }
}

class UnitDealsDamageExcludingAoeSpecialsNode extends TargetDealsDamageExcludingAoeSpecialsNode {
    static {
        Object.assign(this, GetUnitDuringCombatMixin);
    }
}

class UnitDealsDamageBeforeCombatNode extends ApplyingNumberNode {
    getDescription(n) {
        return `与えるダメージ+${n}(戦闘前)`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let context = unit.battleContext;
        let beforeValue = context.additionalDamageInPrecombat;
        context.additionalDamageInPrecombat += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${beforeValue} => ${context.additionalDamageInPrecombat}`);
    }
}

class ReducesDamageExcludingAoeSpecialsNode extends ApplyingNumberNode {
    getDescription(n) {
        return `受けるダメージ-${n}`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let context = unit.battleContext;
        let beforeValue = context.damageReductionValue;
        context.damageReductionValue += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${beforeValue} => ${context.damageReductionValue}`);
    }
}

class ReducesDamageBeforeCombatNode extends ApplyingNumberNode {
    getDescription(n) {
        return `受けるダメージ-${n}(戦闘前)`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let context = unit.battleContext;
        let beforeValue = context.damageReductionForPrecombat;
        context.damageReductionForPrecombat += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${beforeValue} => ${context.damageReductionForPrecombat}`);
    }
}

/**
 * reduces damage from foe's attacks by 40% during combat (excluding area-of-effect Specials),
 */
class ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let percentage = this.evaluateChildren(env);
        unit.battleContext.addDamageReductionRatio(percentage / 100);
        let ratios = unit.battleContext.getDamageReductionRatios();
        env.debug(`${unit.nameWithGroup}は受けた攻撃のダメージを${percentage}%軽減: ratios [${ratios}]`);
    }
}

/**
 * reduces damage from foe's first attack by X% during combat
 */
class ReducesDamageFromFoesFirstAttackByNPercentDuringCombatNode extends ApplyingNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let percentage = this.evaluateChildren(env);
        unit.battleContext.addDamageReductionRatioOfFirstAttacks(percentage / 100);
        unit.battleContext.addDamageReductionRatioOfFirstAttack(percentage / 100);
        let ratios = unit.battleContext.getDamageReductionRatiosOfFirstAttack();
        env.debug(`${unit.nameWithGroup}は最初に受けた攻撃のダメージを${percentage}%軽減: ratios [${ratios}]`);
    }
}

/**
 * reduces damage from foe's first attack by X% during combat
 * ("First attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes.)
 */
class ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode extends ApplyingNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let percentage = this.evaluateChildren(env);
        unit.battleContext.addDamageReductionRatioOfFirstAttacks(percentage / 100);
        let ratios = unit.battleContext.getDamageReductionRatiosOfFirstAttacks();
        env.debug(`${unit.nameWithGroup}は最初に受けた攻撃と2回攻撃のダメージを${percentage}%軽減: ratios [${ratios}]`);
    }
}

/**
 * reduces damage from foe's first attack by X during combat
 */
class ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode extends ApplyingNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let n = this.evaluateChildren(env);
        unit.battleContext.damageReductionValueOfFirstAttacks += n;
        let reduction = unit.battleContext.damageReductionValueOfFirstAttacks;
        env.debug(`${unit.nameWithGroup}は最初に受けた攻撃と2回攻撃のダメージ-${n}: ${reduction - n} => ${reduction}`);
    }
}

class ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode extends ApplyingNumberNode {
    getDescription(n) {
        return `敵の奥義による攻撃の時、受けるダメージ-${n}`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let context = unit.battleContext;
        let beforeValue = context.damageReductionValueOfSpecialAttack;
        context.damageReductionValueOfSpecialAttack += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${beforeValue} => ${context.damageReductionValueOfSpecialAttack}`);
    }
}

class DealsDamageWhenTriggeringSpecialDuringCombatPerAttackNode extends ApplyingNumberNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        unit.battleContext.additionalDamageOfSpecialPerAttackInCombat += n;
        let damage = unit.battleContext.additionalDamageOfSpecialPerAttackInCombat;
        env.debug(`${unit.nameWithGroup}は戦闘中、自分の奥義によるダメージ+${n}: ${damage - n} => ${damage}`);
    }
}

/**
 * [Special]
 * Reduces damage from attacks during combat by percentage = N
 */
class ReducesDamageFromAttacksDuringCombatByXPercentConsideredSpecialPerAttackNode extends FromNumberEnsuredNonNegativeNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        unit.battleContext.damageReductionRatiosBySpecialPerAttack.push(n / 100.0);
        env.debug(`${unit.nameWithGroup}はこの攻撃の際にダメージを${n}%軽減(奥義扱い): ratios [${unit.battleContext.damageReductionRatiosBySpecialPerAttack}]`);
    }
}

class RestoresHpToUnitAfterCombatNode extends ApplyingNumberNode {
    getDescription(n) {
        return `戦闘後HPを${n}回復`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}`);
        unit.battleContext.healedHpAfterCombat += n;
    }
}

const RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE = new RestoresHpToUnitAfterCombatNode(7);

const WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は奥義発動時、奥義以外のスキルによる「ダメージを〇〇%軽減」を無効(ダメージ加算、軽減無効は、範囲奥義を除く)`);
        unit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
    }
}();

class ReducesPercentageOfNonSpecialDamageReductionByNPercentDuringCombatNode extends FromNumberNode {
    evaluate(env) {
        let percentage = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let ratios = unit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial;
        ratios.push(percentage / 100);
        env.debug(`${unit.nameWithGroup}はダメージ軽減を${percentage}%無効。ratios: [${ratios}]`);
    }
}

const REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE
    = new ReducesPercentageOfNonSpecialDamageReductionByNPercentDuringCombatNode(50);

const NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は奥義発動カウント変動量-を無効`);
        unit.battleContext.neutralizesReducesCooldownCount();
    }
}();

const INFLICTS_SPECIAL_COOLDOWN_CHARGE_MINUS_1_ON_FOE_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は敵の奥義発動カウント変動量-1`);
        unit.battleContext.reducesCooldownCount = true;
    }
}();

const UNIT_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は暗闘効果を発動(戦闘相手以外の敵軍のスキルを無効化)`);
        unit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
    }
}();

const FOE_DISABLES_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        env.debug(`${unit.nameWithGroup}は暗闘効果を発動(戦闘相手以外の敵軍のスキルを無効化)`);
        unit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
    }
}();

/**
 * unit can counterattack regardless of foe's range.
 */
class TargetCanCounterattackRegardlessOfRangeNode extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は距離に関係なく反撃する`);
        unit.battleContext.canCounterattackToAllDistance = true;
    }
}

const TARGET_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE = new TargetCanCounterattackRegardlessOfRangeNode();

/**
 * Calculates damage using the lower of foe's Def or Res.
 */
const CALCULATES_DAMAGE_USING_THE_LOWER_OF_FOES_DEF_OR_RES_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は敵の守備か魔防の低い方でダメージ計算)`);
        unit.battleContext.refersMinOfDefOrRes = true;
    }
}();

/**
 * Unit attacks twice (even if foe initiates combat, unit attacks twice).
 */
const TARGET_ATTACKS_TWICE_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は2回攻撃): ${unit.battleContext.attackCount} => 2`);
        unit.battleContext.attackCount = 2;
    }
}();

const TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は受け時に2回攻撃): ${unit.battleContext.counterattackCount} => ${2}`);
        unit.battleContext.counterattackCount = 2;
    }
}();

class WhenSpecialTriggersReducesDamageFromTargetsFoesAttacksByNPercentNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.damageReductionRatioBySpecial = n / 100;
        env.debug(`${unit.nameWithGroup}は奥義発動、攻撃のダメージを${n}%軽減`);
    }
}

class ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial.push(n / 100.0);
        let ratios = unit.battleContext.nTimesDamageReductionRatiosByNonDefenderSpecial;
        env.debug(`${unit.nameWithGroup}は受けた攻撃のダメージを${n}%軽減(1戦闘1回のみ): ratios [${ratios}]`);
    }
}

class GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialCountReductionBeforeFirstAttack += n;
        let result = unit.battleContext.specialCountReductionBeforeFirstAttack;
        env.debug(`${unit.nameWithGroup}は自分の最初の攻撃前に自身の奥義発動カウント-${n}: ${result - n} => ${result}`);
    }
}

class GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstFollowUpAttackDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialCountReductionBeforeFollowupAttack += n;
        let reduction = unit.battleContext.specialCountReductionBeforeFollowupAttack;
        env.debug(`${unit.nameWithGroup}は自分の最初の追撃前に自身の奥義発動カウント-${n}: ${reduction - n} => ${reduction}`);
    }
}

// 自分の最初の追撃前に奥義発動カウント-N(符号に注意Nは自然数)
class UnitGrantsSpecialCooldownMinusNToUnitBeforeUnitsFirstFollowUpAttackNode extends GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstFollowUpAttackDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_FOLLOW_UP_ATTACK_NODE =
    new UnitGrantsSpecialCooldownMinusNToUnitBeforeUnitsFirstFollowUpAttackNode(1);

class GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstAttackDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialCountReductionBeforeFirstAttackByEnemy += n;
        let result = unit.battleContext.specialCountReductionBeforeFirstAttackByEnemy;
        env.debug(`${unit.nameWithGroup}は相手の最初の攻撃前に自身の奥義発動カウント-${n}: ${result - n} => ${result}`);
    }
}

class GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstFollowUpAttackDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialCountReductionBeforeFirstFollowUpAttackByEnemy += n;
        let result = unit.battleContext.specialCountReductionBeforeFirstFollowUpAttackByEnemy;
        env.debug(`${unit.nameWithGroup}は相手の最初の追撃の前に自身の奥義発動カウント-${n}: ${result - n} => ${result}`);
    }
}

class GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesSecondStrikeDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialCountReductionBeforeSecondFirstAttacksByEnemy += n;
        let result = unit.battleContext.specialCountReductionBeforeSecondFirstAttacksByEnemy;
        env.debug(`${unit.nameWithGroup}は相手の最初の2回攻撃の2回目の前に自身の奥義発動カウント-${n}: ${result - n} => ${result}`);
    }
}

/**
 * inflicts Special cooldown count+1 on foe before foe's first attack (cannot exceed the foe's maximum Special cooldown).
 */
class InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstAttack extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n) {
        super(n);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialCountIncreaseBeforeFirstAttack += n;
        let result = unit.battleContext.specialCountIncreaseBeforeFirstAttack;
        env.debug(`${unit.nameWithGroup}は敵の最初の攻撃前に敵の奥義発動カウント+${n}: ${result - n} => ${result}`);
    }
}

const INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_FOE_BEFORE_FOES_FIRST_ATTACK = n =>
    new class extends InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstAttack {
        static {
            Object.assign(this.prototype, GetFoeDuringCombatMixin);
        }
    }(n);

class GrantsSpecialCooldownCountMinusNToUnitBeforeFoesFirstAttackDuringCombatNode
    extends GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstAttackDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

class CanTargetActivateNonSpecialMiracleNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.canActivateNonSpecialMiracle = true;
        let threshold = this.evaluateChildren(env);
        unit.battleContext.nonSpecialMiracleHpPercentageThreshold = threshold;
        env.debug(`HP${threshold}%以上の時${unit.nameWithGroup}は奥義以外の祈りを発動可能`);
    }
}

// TODO: if foe's first attack triggers the "attacks twice" effect, grants Special cooldown count-1 to unit before foe's second strike as well

/**
 * Effective against
 */
class EffectiveAgainstNode extends BoolNode {
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let unit = env.unitDuringCombat;
        let foe = env.foeDuringCombat;
        let type = this.evaluateChildren(env)[0];
        // noinspection JSCheckFunctionSignatures
        if (DamageCalculationUtility.isEffectiveAttackEnabled(foe, type)) {
            unit.battleContext.isEffectiveToOpponent = true;
            env.debug(`${unit.nameWithGroup}は相手に対して特攻`);
        } else {
            env.debug(`${foe.nameWithGroup}は特攻無効`);
        }
    }
}

/**
 * If foe's attack triggers unit's Special and Special has the "reduces damage by X%" effect, Special triggers twice, then reduces damage by N.
 */
class TargetsSpecialTriggersTwiceThenReducesDamageByNNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.canDamageReductionSpecialTriggerTwice = true;
        let n = this.evaluateChildren(env)[0];
        env.debug(`${unit.nameWithGroup}はダメージ軽減奥義を複製発動`);
        if (n > 0) {
            unit.battleContext.damageReductionValueAfterSpecialTriggerTwice += n;
            env.debug(`${unit.nameWithGroup}はその後、受けるダメージ-${n}: => ${unit.battleContext.damageReductionValueAfterSpecialTriggerTwice}`);
        }
    }
}

/**
 * neutralizes effects that prevent those allies' counterattacks during their combat.
 */
class NeutralizesEffectsThatPreventTargetsCounterattacksDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.nullCounterDisrupt = true;
        env.debug(`${unit.nameWithGroup}は自身の反撃不可を無効`);
    }
}

/**
 * when unit deals damage to foe during combat, restores 7 HP to unit (triggers even if 0 damage is dealt).
 */
class WhenTargetDealsDamageDuringCombatRestoresNHPToTargetNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = this.evaluateChildren(env);
        unit.battleContext.healedHpByAttack += result;
        env.debug(`${unit.nameWithGroup}は自分の攻撃でダメージを与えた時、${result}回復（与えたダメージが0でも効果は発動）`);
    }
}

class NeutralizeTargetsFoesReducesDamageByXPercentEffectsFromTargetFoesNonSpecialNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.invalidatesDamageReductionExceptSpecialForNextAttackAfterDefenderSpecial = true;
        env.debug(`${unit.nameWithGroup}は奥義発動後相手の奥義以外のダメージ軽減を無効`);
    }
}

class AfterSpecialTriggersTargetsNextAttackDealsDamageEqTotalDamageReducedNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.canAddDamageReductionToNextAttackAfterSpecial = true;
        env.debug(`${unit.nameWithGroup}は奥義で軽減した値を、自身の次の攻撃のダメージに+`);
    }
}


/**
 * unit's next attack deals damage = total damage reduced from foe's first attack (by any source, including other skills; resets at end of combat).
 */
class TargetsNextAttackDealsDamageEqTotalDamageReducedFromTargetsFoesFirstAttackNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.canAddDamageReductionToNextAttackFromEnemiesFirstAttack = true;
        env.debug(`${unit.nameWithGroup}は敵の最初の攻撃で軽減した値を、自身の次の攻撃のダメージに+`);
    }
}

/**
 * restores X HP to unit as unit's combat begins
 */
class RestoresXHPToTargetAsTargetsCombatBeginsNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.addHealAmountAfterAfterBeginningOfCombatSkills(n);
        env.debug(`${unit.nameWithGroup}は戦闘開始後${n}回復`);
    }
}

/**
 * reduces the effect of【Deep Wounds】on unit by 50% during combat.
 */
class ReducesEffectOfDeepWoundsOnTargetByXPercentDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let x = this.evaluateChildren(env);
        unit.battleContext.addNullInvalidatesHealRatios(x / 100);
        env.debug(`${unit.nameWithGroup}は自身の【回復不可】を${x}%無効`);
    }
}

class AfterSpecialTriggersTargetsNextAttackDealsDamageMinNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.nextAttackMinAdditionAfterSpecial = n;
        env.debug(`${unit.nameWithGroup}は奥義で軽減した値を、自身の次の攻撃のダメージに+する効果の最小 : ${n}`);
    }
}

class CalculatesDamageUsingTheLowerOfTargetsFoesDefOrResWhenSpecialTriggersNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.refersLowerDefOrResWhenSpecial = true;
        env.debug(`${unit.nameWithGroup}は奥義発動時、敵の守備か魔防の低い方でダメージ計算`);
    }
}

// Unit or BattleContextに値を設定 END

class CanTargetCanMakeFollowUpIncludingPotentNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は追撃可能か";

    getValue(unit) {
        return unit.battleContext.canFollowupAttackIncludingPotent();
    }
}

const CAN_TARGET_CAN_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE = new CanTargetCanMakeFollowUpIncludingPotentNode();

// TODO: 命名規則を統一させる
class IfTargetTriggersAttacksTwiceNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は2回攻撃を発動しているか";

    getValue(unit) {
        return unit.battleContext.isTriggeringAttackTwice();
    }
}

const IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE = new IfTargetTriggersAttacksTwiceNode();

class IfTargetsFoeTriggersAttacksTwiceNode extends IfTargetTriggersAttacksTwiceNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class TargetCanAttackDuringCombatNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は攻撃可能か";

    getValue(unit) {
        return unit.battleContext.canAttackInCombat();
    }
}

const TARGET_CAN_ATTACK_DURING_COMBAT_NODE = new TargetCanAttackDuringCombatNode();

/**
 * damage dealt to unit as combat begins
 */
class DamageDealtToTargetAsCombatBeginsNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.getMaxDamageAfterBeginningOfCombat();
        env.debug(`${unit.nameWithGroup}は戦闘開始後${result}のダメージを受けた`);
        return result;
    }
}

// noinspection JSUnusedGlobalSymbols
class GrantsOrInflictsStatsAfterStatusFixedNode extends SkillEffectNode {
    evaluate(env) {
        let node = new SkillEffectNode(...this.getChildren());
        env.unitDuringCombat.battleContext.applySpurForUnitAfterCombatStatusFixedNodes.push(node);
    }
}

class AppliesSkillEffectsAfterStatusFixedNode extends SkillEffectNode {
    evaluate(env) {
        let node = new SkillEffectNode(...this.getChildren());
        env.unitDuringCombat.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedNodes.push(node);
    }
}

class UnitAppliesSkillEffectsPerAttack extends SkillEffectNode {
    /**
     * @param {DamageCalculatorEnv|NodeEnv} env
     */
    evaluate(env) {
        let node = new SkillEffectNode(...this.getChildren());
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}の攻撃ごとのスキル効果を設定`);
        unit.battleContext.applySkillEffectPerAttackNodes.push(node);
    }
}

/**
 * grants Special cooldown charge +1 to unit per attack during combat (only highest value applied; does not stack).
 */
class GrantsSpecialCooldownChargePlus1ToTargetPerAttackDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.increaseCooldownCountForBoth();
        env.debug(`${unit.nameWithGroup}は戦闘中、自身の奥義発動カウント変動量+1`);
    }
}

class GrantsSpecialCooldownChargePlus1ToUnitPerAttackDuringCombatNode
    extends GrantsSpecialCooldownChargePlus1ToTargetPerAttackDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const GRANTS_SPECIAL_COOLDOWN_CHARGE_PLUS_1_TO_UNIT_PER_ATTACK_DURING_COMBAT_NODE =
    new GrantsSpecialCooldownChargePlus1ToUnitPerAttackDuringCombatNode();

/**
 * calculates damage using 150% of unit's Def instead of the value of unit's Atk when Special triggers.
 */
class CalculatesDamageUsingXPercentOfTargetsStatInsteadOfAtkNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let percentage = this.evaluateChildren(env);
        unit.battleContext.usesDefInsteadOfAtkWhenSpecial = true;
        unit.battleContext.ratioForUsingAnotherStatWhenSpecial = percentage / 100.0;
        env.debug(`${unit.nameWithGroup}は奥義発動時攻撃の代わりに守備の値を使用(${percentage}%)`);
    }
}
