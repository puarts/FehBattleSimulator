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

class TargetsHpAtStartOfTurnNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let hp = unit.hp;
        env.debug(`${unit.nameWithGroup}のターン開始時のHP: ${hp}`);
        return hp;
    }
}

class TargetsHpOnMapNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let hp = unit.hp;
        env.debug(`${unit.nameWithGroup}のマップ上でのHP: ${hp}`);
        return hp;
    }
}

const TARGETS_HP_ON_MAP_NODE = new TargetsHpOnMapNode();
const IS_TARGET_ALIVE = GT_NODE(TARGETS_HP_ON_MAP_NODE, 0);
const IS_TARGET_DEAD = NOT_NODE(IS_TARGET_ALIVE);

class FoesHpOnMapNode extends TargetsHpOnMapNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOES_HP_ON_MAP_NODE = new FoesHpOnMapNode();

class FoesHpAtStartOfTurnNode extends TargetsHpAtStartOfTurnNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

// TODO: ターン開始時HPと戦闘開始時HPについて調査する
class TargetsHpAtStartOfCombatNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let hp = unit.hp;
        env.debug(`${unit.nameWithGroup}の戦闘開始時のHP: ${hp}`);
        return hp;
    }
}

const TARGETS_HP_AT_START_OF_COMBAT_NODE = new TargetsHpAtStartOfCombatNode();

class FoesHpAtStartOfCombatNode extends TargetsHpAtStartOfCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class TargetsCurrentHp extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.restHp;
        env.debug(`${unit.nameWithGroup}の現在のHP: ${result}`);
        return result;
    }
}

const TARGETS_CURRENT_HP_NODE = new TargetsCurrentHp();

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

class TargetsHpDuringCombatNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.restHp;
        env.debug(`${unit.nameWithGroup}の戦闘中のHP: ${result}/${unit.maxHpWithSkills}`);
        return result;
    }
}

const TARGETS_HP_DURING_COMBAT_NODE = new TargetsHpDuringCombatNode();

class FoesHpDuringCombatNode extends TargetsHpDuringCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

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
const IS_UNITS_HP_GTE_100_PERCENT_AT_START_OF_TURN_NODE = new IsUnitsHpGteNPercentAtStartOfTurnNode(100);

class IsUnitsHpLteNPercentAtStartOfTurnNode extends PercentageCondNode {
    evaluate(env) {
        let unit = env.targetUnit;
        let hpPercentage = unit.restHpPercentageAtBeginningOfTurn;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以下であるか: ${hpPercentage}%(HP:${unit.battleContext.restHp}) >= ${this._percentage}%`);
        return hpPercentage <= this._percentage;
    }
}

const IS_UNITS_HP_LTE_50_PERCENT_AT_START_OF_TURN_NODE = new IsUnitsHpLteNPercentAtStartOfTurnNode(50);

class IsUnitsHpGteNPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let hpPercentage = unit.battleContext.restHpPercentage;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以上であるか: ${hpPercentage}%(HP:${unit.battleContext.restHp}) >= ${this._percentage}%`);
        return hpPercentage >= this._percentage;
    }
}

const IS_UNITS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE = new IsUnitsHpGteNPercentAtStartOfCombatNode(25);
const IS_UNITS_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE = new IsUnitsHpGteNPercentAtStartOfCombatNode(50);

class IsUnitsHpLteNPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let hpPercentage = unit.battleContext.restHpPercentage;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以下であるか: ${hpPercentage}%(HP:${unit.battleContext.restHp}) >= ${this._percentage}%`);
        return hpPercentage <= this._percentage;
    }
}

const IS_UNITS_HP_LTE_25_PERCENT_AT_START_OF_COMBAT_NODE = new IsUnitsHpLteNPercentAtStartOfCombatNode(25);
const IS_UNITS_HP_LTE_50_PERCENT_AT_START_OF_COMBAT_NODE = new IsUnitsHpLteNPercentAtStartOfCombatNode(50);

class IsTargetsHpLteNPercentInCombatNode extends PercentageCondNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        // targetUnit.battleContext.restHpPercentage ではなくこちらが正しい
        let unit = this.getUnit(env);
        let hpPercentage = unit.restHpPercentage;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以下であるか: ${hpPercentage}%(HP:${unit.restHp}) <= ${this._percentage}%`);
        return hpPercentage <= this._percentage;
    }
}

const IS_TARGETS_HP_LTE_N_PERCENT_IN_COMBAT_NODE = n => new IsTargetsHpLteNPercentInCombatNode(n);
const IS_TARGETS_HP_LTE_99_PERCENT_IN_COMBAT_NODE = IS_TARGETS_HP_LTE_N_PERCENT_IN_COMBAT_NODE(99);

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
const IS_FOES_HP_GTE_70_PERCENT_AT_START_OF_COMBAT_NODE = new IsFoesHpGteNPercentAtStartOfCombatNode(70);
const IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE = new IsFoesHpGteNPercentAtStartOfCombatNode(75);

class IsTargetsHpLteXPercentOnMapNode extends PercentageCondNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let hpPercentage = unit.hpPercentage;
        env.debug(`${unit.nameWithGroup}のHPが${this._percentage}%以下であるか: ${hpPercentage}%(HP:${unit.hp}) <= ${this._percentage}%`);
        return hpPercentage <= this._percentage;
    }
}

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

class GrantsSpecialCooldownCountMinusNToTargetAfterFirstSpecialTriggerPerCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let count = this.evaluateChildren(env);
        let result = unit.battleContext.specialCountReductionAfterFirstSpecial += count;
        env.debug(`${unit.nameWithGroup}は各戦闘の最初の奥義発動後、奥義発動カウント-${count}: ${result}`);
    }
}

const FOE_CANNOT_COUNTERATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は反撃不可`);
        unit.battleContext.invalidatesCounterattack = true;
    }
}();

class IsTargetsSpecialTriggeredNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.hasSpecialActivated;
        env.debug(`${unit.nameWithGroup}は奥義を発動したか: ${result}`)
        return result;
    }
}

const IS_TARGETS_SPECIAL_TRIGGERED_NODE = new IsTargetsSpecialTriggeredNode();

const IS_UNITS_SPECIAL_TRIGGERED = new class extends IsTargetsSpecialTriggeredNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}();

const IS_FOES_SPECIAL_TRIGGERED = new class extends IsTargetsSpecialTriggeredNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}();

class IsTargetsSpecialTriggeredBeforeCombatNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isPreCombatSpecialActivated;
        env.debug(`${unit.nameWithGroup}は範囲奥義を発動済み: ${result}`);
        return result;
    }
}

const UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        unit.battleContext.followupAttackPriorityIncrement++;
        env.debug(`${unit.nameWithGroup}は絶対追撃: ${unit.battleContext.followupAttackPriorityIncrement}`);
    }
}();

const FOE_SUFFERS_GUARANTEED_FOLLOW_UP_ATTACKS_DURING_COMBAT = UNIT_MAKES_GUARANTEED_FOLLOW_UP_ATTACK_NODE;

class TargetCannotMakeFollowUpAttackNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.followupAttackPriorityDecrement--;
        env.debug(`${unit.nameWithGroup}は追撃不可: ${unit.battleContext.followupAttackPriorityDecrement}`);
    }
}

const TARGET_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE = new TargetCannotMakeFollowUpAttackNode();

const FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE = new class extends TargetCannotMakeFollowUpAttackNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
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

class NeutralizesEffectsThatGuaranteeTargetsFoesFollowUpAttacksDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.invalidatesAbsoluteFollowupAttack = true;
        env.debug(`${unit.nameWithGroup}は敵の絶対追撃を無効`);
    }
}

const NEUTRALIZES_EFFECTS_THAT_GUARANTEE_TARGETS_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE =
    new NeutralizesEffectsThatGuaranteeTargetsFoesFollowUpAttacksDuringCombatNode();

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

const FOE_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_UNITS_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
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

class TargetCannotTriggerDefenderSpecialPerAttackNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.preventedDefenderSpecialPerAttack = true;
        env.debug(`${unit.nameWithGroup}は「敵から攻撃を受ける際に発動する奥義」を発動できない`);
    }
}

const TARGET_CANNOT_TRIGGER_DEFENDER_SPECIAL_PER_ATTACK_NODE =
    new TargetCannotTriggerDefenderSpecialPerAttackNode();

class TargetsFoeCannotTriggerDefenderSpecialPerAttackNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = env.getFoeDuringCombatOf(this.getUnit(env));
        unit.battleContext.preventedDefenderSpecialPerAttack = true;
        env.debug(`${unit.nameWithGroup}は「敵から攻撃を受ける際に発動する奥義」を発動できない`);
    }
}

const TARGETS_FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL_PER_ATTACK_NODE =
    new TargetsFoeCannotTriggerDefenderSpecialPerAttackNode();

const PREVENTS_TARGETS_FOES_SPECIALS_THAT_ARE_TRIGGERED_BY_TARGETS_ATTACK_NODE =
    TARGETS_FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL_PER_ATTACK_NODE;

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

const DISABLES_UNITS_AND_FOES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY_NODE = SKILL_EFFECT_NODE(
    UNIT_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY,
    FOE_DISABLES_SKILLS_THAT_CHANGE_ATTACK_PRIORITY,
);

class IncreasesSpdDiffNecessaryForTargetToMakeFollowUpNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += n;
        env.debug(`${unit.nameWithGroup}の追撃の速さ条件+${n}: ${unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
    }
}

class IncreasesSpdDiffNecessaryForFoeToMakeFollowUpNode extends IncreasesSpdDiffNecessaryForTargetToMakeFollowUpNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

/**
 * increases the Spd difference necessary for foe to make a follow-up attack by N during combat
 */
class IncreasesSpdDiffNecessaryForTargetsFoesFollowUpNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let foe = env.getFoeDuringCombatOf(unit);
        foe.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += n;
        env.debug(`${foe.nameWithGroup}の追撃の速さ条件+${n}: ${unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
    }
}

const INCREASES_SPD_DIFF_NECESSARY_FOR_TARGETS_FOES_FOLLOW_UP_NODE = n => new IncreasesSpdDiffNecessaryForTargetsFoesFollowUpNode(n);

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

const DECREASES_SPD_DIFF_NECESSARY_FOR_UNIT_FOLLOW_UP_NODE
    = n => new DecreasesSpdDiffNecessaryForUnitFollowUpNode(n);

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

const NEUTRALIZES_EACH_PENALTIES_ON_UNIT_NODE =
    (atk, spd, def, res) => new NeutralizesPenaltiesToUnitsStatsNode(atk, spd, def, res);
const NEUTRALIZES_PENALTIES_ON_UNIT_NODE = new NeutralizesPenaltiesToUnitsStatsNode(true, true, true, true);

/**
 * neutralizes foe's bonuses to Spd/Def
 */
class NeutralizesFoesBonusesToStatsDuringCombatNode extends SetBoolToEachStatusNode {
    evaluate(env) {
        let values = this.getValues();
        let unit = env.unitDuringCombat;
        let foe = env.getFoeDuringCombatOf(unit);
        env.debug(`${unit.nameWithGroup}は相手(${foe.nameWithGroup})の強化を無効: [${values}]`);
        unit.battleContext.invalidateBuffs(...values);
    }
}

const NEUTRALIZES_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE =
    new NeutralizesFoesBonusesToStatsDuringCombatNode(true, true, true, true);
const NEUTRALIZES_FOES_EACH_BONUSES_TO_STATS_DURING_COMBAT_NODE =
    (atk = true, spd = true, def = true, res = true) =>
        new NeutralizesFoesBonusesToStatsDuringCombatNode(atk, spd, def, res);

class NeutralizesTargetsFoesBonusesToStatsDuringCombatNode extends SetBoolToEachStatusNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let values = this.getValues();
        let unit = this.getUnit(env);
        let foe = env.getFoeDuringCombatOf(unit);
        if (foe) {
            env.debug(`${unit.nameWithGroup}は相手(${foe.nameWithGroup})の強化を無効: [${values}]`);
            unit.battleContext.invalidateBuffs(...values);
        }
    }
}

const NEUTRALIZES_TARGETS_FOES_BONUSES_TO_STATS_DURING_COMBAT_NODE =
    (...flags) => new NeutralizesTargetsFoesBonusesToStatsDuringCombatNode(...flags);

class NeutralizesTargetsBonusesToStatsDuringCombatNode extends NeutralizesTargetsFoesBonusesToStatsDuringCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const NEUTRALIZES_TARGETS_BONUSES_TO_STATS_DURING_COMBAT_NODE =
    (...flags) => new NeutralizesTargetsBonusesToStatsDuringCombatNode(...flags);

/**
 * number of【Bonus】effects active on unit, excluding stat bonuses + number of【Penalty】effects active on foe, excluding stat penalties
 */
const NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        return env.unitDuringCombat.getPositiveStatusEffects().length + env.foeDuringCombat.getNegativeStatusEffects().length;
    }
}();

class NumOfBonusesActiveOnTargetExcludingStatNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.getPositiveStatusEffects().length;
        env.debug(`${unit.nameWithGroup}の有利な状態の数: ${result}`);
        return result;
    }
}

const NUM_OF_BONUSES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE = new NumOfBonusesActiveOnTargetExcludingStatNode();

class NumOfBonusesActiveOnFoeExcludingStatNode extends NumOfBonusesActiveOnTargetExcludingStatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const NUM_OF_BONUSES_ACTIVE_ON_FOE_EXCLUDING_STAT_NODE = new NumOfBonusesActiveOnFoeExcludingStatNode();

class NumOfPenaltiesActiveOnTargetExcludingStatNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.getNegativeStatusEffects().length;
        env.debug(`${unit.nameWithGroup}の不利な状態の数: ${result}`);
        return result;
    }
}

const NUM_OF_PENALTIES_ACTIVE_ON_TARGET_EXCLUDING_STAT_NODE = new NumOfPenaltiesActiveOnTargetExcludingStatNode();

class NumOfPenaltiesActiveOnFoeExcludingStatNode extends NumOfPenaltiesActiveOnTargetExcludingStatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const NUM_OF_PENALTIES_ACTIVE_ON_FOE_EXCLUDING_STAT_NODE = new NumOfPenaltiesActiveOnFoeExcludingStatNode();

class BonusesActiveOnTargetExcludingStatSetNode extends SetNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param env
     * @returns {Set<Number>}
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let result = new Set(unit.getPositiveStatusEffects());
        env.debug(`${unit.nameWithGroup}の有利な状態: ${[...result].map(e => getStatusEffectName(e))}`);
        return result;
    }
}

class PenaltiesActiveOnTargetExcludingStatSetNode extends SetNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param env
     * @returns {Set<Number>}
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let result = new Set(unit.getNegativeStatusEffects());
        env.debug(`${unit.nameWithGroup}の不利な状態: ${[...result].map(e => getStatusEffectName(e))}`);
        return result;
    }
}

const NUM_OF_BONUS_ON_UNIT_EXCLUDING_STAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let result = unit.getPositiveStatusEffects().length;
        env.debug(`${unit.nameWithGroup}の有利な状態の数: ${result}`);
        return result;
    }
}();

class NumOfPenaltiesOnTargetExcludingStatNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.getNegativeStatusEffects().length;
        env.debug(`${unit.nameWithGroup}の不利な状態の数: ${result}`);
        return result;
    }
}

const NUM_OF_PENALTIES_ON_TARGET_EXCLUDING_STAT_NODE = new NumOfPenaltiesOnTargetExcludingStatNode();

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

const BOOSTS_DAMAGE_WHEN_SPECIAL_TRIGGERS_NODE = n => new BoostsDamageWhenSpecialTriggersNode(n);

class RestoresXPercentageOfTargetsMaximumHpNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let percentage = this.evaluateChildren(env);
        unit.battleContext.maxHpRatioToHealBySpecial = percentage / 100;
        env.debug(`${unit.nameWithGroup}は自分の最大HPの${percentage}を回復`);
    }
}

const RESTORES_X_PERCENTAGE_OF_TARGETS_MAXIMUM_HP_NODE = n => new RestoresXPercentageOfTargetsMaximumHpNode(n);

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

const UNIT_DEALS_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE =
    (value) => new UnitDealsDamageExcludingAoeSpecialsNode(value);

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

const UNIT_DEALS_DAMAGE_BEFORE_COMBAT_NODE = n => new UnitDealsDamageBeforeCombatNode(n);
const UNIT_DEALS_DAMAGE_AT_AOE = n => new UnitDealsDamageBeforeCombatNode(n);

class ReducesDamageExcludingAoeSpecialsNode extends ApplyingNumberNode {
    getDescription(n) {
        return `受けるダメージ-${n}（範囲奥義を除く）`;
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

const REDUCES_DAMAGE_EXCLUDING_AOE_SPECIALS_NODE = n => new ReducesDamageExcludingAoeSpecialsNode(n);

class ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode extends ApplyingNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    getDescription(n) {
        return `受けるダメージ-${n}（範囲奥義を除く）`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = this.getUnit(env);
        let context = unit.battleContext;
        let beforeValue = context.damageReductionValue;
        context.damageReductionValue += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${beforeValue} => ${context.damageReductionValue}`);
    }
}

const REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_NODE =
    n => new ReducesDamageFromTargetsFoesAttacksByXDuringCombatNode(n);

class ReducesDamageFromTargetsFoesAttacksByXDuringCombatPerAttackNode extends ApplyingNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    getDescription(n) {
        return `受けるダメージ-${n}（攻撃ごと、範囲奥義を除く）`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = this.getUnit(env);
        let result = unit.battleContext.damageReductionValuePerAttack += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${result - n} => ${result}`);
    }
}

const REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_DURING_COMBAT_PER_ATTACK_NODE =
    n => new ReducesDamageFromTargetsFoesAttacksByXDuringCombatPerAttackNode(n);

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

const REDUCES_DAMAGE_BEFORE_COMBAT_NODE = n => new ReducesDamageBeforeCombatNode(n);

class ReducesDamageByAoeNode extends ReducesDamageBeforeCombatNode {
}

/**
 * Reduces damage from area-of-effect Specials (excluding Røkkr area-of-effect Specials) by 80%.
 */
class ReducesDamageFromAoeSpecialsByXPercentNode extends ApplyingNumberNode {
    getDescription(n) {
        return `受けた範囲奥義のダメージを${n}%軽減`;
    }

    evaluate(env) {
        let unit = env.unitDuringCombat;
        let n = this.evaluateChildren(env);
        unit.battleContext.multDamageReductionRatioOfPrecombatSpecial(n / 100);
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${unit.battleContext.damageReductionRatioForPrecombat}`);
    }
}

const REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_NODE = x => new ReducesDamageFromAoeSpecialsByXPercentNode(x);
// TODO: 奥義扱いの範囲奥義軽減が特別扱いされた場合に修正する
const REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_BY_SPECIAL_NODE = x => new ReducesDamageFromAoeSpecialsByXPercentNode(x);

const REDUCES_DAMAGE_BY_X_PERCENT_NODE =
    x => IF_ELSE_NODE(IS_IN_COMBAT_PHASE_NODE,
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE(x),
        REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_NODE(x),
    );

const REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_DURING_COMBAT_OR_FROM_AOE_SPECIALS_NODE =
    x => IF_ELSE_NODE(IS_IN_COMBAT_PHASE_NODE,
        REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE(x),
        REDUCES_DAMAGE_FROM_AOE_SPECIALS_BY_X_PERCENT_BY_SPECIAL_NODE(x),
    );

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

const REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE =
    n => new ReducesDamageFromTargetsFoesAttacksByXPercentDuringCombatNode(n);

class ReduceDamageFromTargetsFoesAttacksByXPercentBySpecialNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let percentage = this.evaluateChildren(env);
        unit.battleContext.damageReductionRatiosByNonDefenderSpecial.push(percentage / 100);
        let ratios = unit.battleContext.damageReductionRatiosByNonDefenderSpecial;
        env.debug(`${unit.nameWithGroup}は受けた攻撃のダメージを${percentage}%軽減（奥義扱い）: ratios [${ratios}]`);
    }
}

const REDUCES_DAMAGE_FROM_TARGETS_FOES_ATTACKS_BY_X_PERCENT_BY_SPECIAL_NODE =
    n => new ReduceDamageFromTargetsFoesAttacksByXPercentBySpecialNode(n);

/**
 * reduces damage from foe's first attack by X% during combat
 */
class ReducesDamageFromFoesFirstAttackByNPercentDuringCombatNode extends ApplyingNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let percentage = this.evaluateChildren(env);
        unit.battleContext.addDamageReductionRatioOfFirstAttack(percentage / 100);
        let ratios = unit.battleContext.getDamageReductionRatiosOfFirstAttack();
        env.debug(`${unit.nameWithGroup}は最初に受けた攻撃のダメージを${percentage}%軽減: ratios [${ratios}]`);
    }
}

const REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_DURING_COMBAT_NODE =
    n => new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatNode(n);

class ReducesDamageFromTargetFoesFollowUpAttackByXPercentDuringCombatNode extends ApplyingNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let percentage = this.evaluateChildren(env);
        unit.battleContext.addDamageReductionRatioOfFollowupAttack(percentage / 100);
        let ratios = unit.battleContext.getDamageReductionRatiosOfFirstAttack();
        env.debug(`${unit.nameWithGroup}は追撃のダメージを${percentage}%軽減: ratios [${ratios}]`);
    }
}

const REDUCES_DAMAGE_FROM_TARGET_FOES_FOLLOW_UP_ATTACK_BY_X_PERCENT_DURING_COMBAT_NODE =
    percentage => new ReducesDamageFromTargetFoesFollowUpAttackByXPercentDuringCombatNode(percentage);

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

const REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_DURING_COMBAT_INCLUDING_TWICE_NODE =
    n => new ReducesDamageFromFoesFirstAttackByNPercentDuringCombatIncludingTwiceNode(n);

class ReducesDamageFromFoesFirstAttackByNPercentBySpecialDuringCombatIncludingTwiceNode extends ApplyingNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let percentage = this.evaluateChildren(env);
        unit.battleContext.addDamageReductionRatioOfFirstAttacksBySpecial(percentage / 100);
        let ratios = unit.battleContext.getDamageReductionRatiosOfFirstAttacksBySpecial();
        env.debug(`${unit.nameWithGroup}は最初に受けた攻撃と2回攻撃のダメージを${percentage}%軽減（奥義扱い）: ratios [${ratios}]`);
    }
}

const REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_PERCENT_BY_SPECIAL_DURING_COMBAT_INCLUDING_TWICE_NODE =
    n => new ReducesDamageFromFoesFirstAttackByNPercentBySpecialDuringCombatIncludingTwiceNode(n);

class ReducesDamageFromTargetFoesConsecutiveAttacksByXPercentDuringCombatNode extends ApplyingNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let ratio = n / 100.0;
        unit.battleContext.addDamageReductionRatioOfConsecutiveAttacks(ratio);
        env.debug(`${unit.nameWithGroup}は連撃のダメージを${n}%軽減`);
    }
}

const REDUCES_DAMAGE_FROM_TARGETS_FOES_CONSECUTIVE_ATTACKS_BY_X_PERCENT_DURING_COMBAT_NODE =
    percentage => new ReducesDamageFromTargetFoesConsecutiveAttacksByXPercentDuringCombatNode(percentage);

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

const REDUCES_DAMAGE_FROM_FOES_FIRST_ATTACK_BY_N_DURING_COMBAT_INCLUDING_TWICE_NODE =
    n => new ReducesDamageFromFoesFirstAttackByNDuringCombatIncludingTwiceNode(n);

class ReducesDamageFromTargetsFoesSecondStrikeOfFirstAttackByNDuringCombatNode extends ApplyingNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let reductionValues = unit.battleContext.damageReductionValueOfSecondStrikeOfFirstAttack;
        reductionValues.push(n);
        env.debug(`${unit.nameWithGroup}は最初に受けた2回攻撃の2回目のダメージ-${n}: [${reductionValues}]`);
    }
}

const REDUCES_DAMAGE_FROM_TARGETS_FOES_SECOND_STRIKE_OF_FIRST_ATTACK_BY_N_DURING_COMBAT_NODE =
    n => new ReducesDamageFromTargetsFoesSecondStrikeOfFirstAttackByNDuringCombatNode(n);

class ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode extends ApplyingNumberNode {
    getDescription(n) {
        return `敵の奥義による攻撃の時、受けるダメージ-${n}（範囲奥義を除く）`;
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

const REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_NODE =
    n => new ReducesDamageWhenFoesSpecialExcludingAoeSpecialNode(n);

class ReducesDamageWhenFoesSpecialExcludingAoeSpecialPerAttackNode extends ApplyingNumberNode {
    getDescription(n) {
        return `敵の奥義による攻撃の時、受けるダメージ-${n}（攻撃ごと、範囲奥義を除く）`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let result = unit.battleContext.damageReductionValueOfSpecialAttackPerAttack += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${result - n} => ${result}`);
    }
}

const REDUCES_DAMAGE_WHEN_FOES_SPECIAL_EXCLUDING_AOE_SPECIAL_PER_ATTACK_NODE =
    n => new ReducesDamageWhenFoesSpecialExcludingAoeSpecialPerAttackNode(n);

class DealsDamageWhenTriggeringSpecialDuringCombatNode extends ApplyingNumberNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        unit.battleContext.additionalDamageOfSpecial += n;
        let damage = unit.battleContext.additionalDamageOfSpecial;
        env.debug(`${unit.nameWithGroup}は戦闘中、自分の奥義によるダメージ+${n}: ${damage - n} => ${damage}`);
    }
}

const DEALS_DAMAGE_WHEN_TRIGGERING_SPECIAL_DURING_COMBAT_NODE =
    n => new DealsDamageWhenTriggeringSpecialDuringCombatNode(n);

class DealsDamageWhenTriggeringSpecialDuringCombatPerAttackNode extends ApplyingNumberNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        unit.battleContext.additionalDamageOfSpecialPerAttackInCombat += n;
        let damage = unit.battleContext.additionalDamageOfSpecialPerAttackInCombat;
        env.debug(`${unit.nameWithGroup}は戦闘中、自分の奥義によるダメージ+${n}: ${damage - n} => ${damage}`);
    }
}

const DEALS_DAMAGE_WHEN_TRIGGERING_SPECIAL_DURING_COMBAT_PER_ATTACK_NODE =
    n => new DealsDamageWhenTriggeringSpecialDuringCombatPerAttackNode(n);

/**
 * [Special]
 * Reduces damage from attacks during combat by percentage = N
 */
class ReducesDamageFromAttacksDuringCombatByXPercentAsSpecialSkillEffectPerAttackNode extends FromNumberEnsuredNonNegativeNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        unit.battleContext.damageReductionRatiosBySpecialPerAttack.push(n / 100.0);
        env.debug(`${unit.nameWithGroup}はこの攻撃の際にダメージを${n}%軽減(奥義扱い): ratios [${unit.battleContext.damageReductionRatiosBySpecialPerAttack}]`);
    }
}

const REDUCES_DAMAGE_FROM_ATTACKS_DURING_COMBAT_BY_X_PERCENT_AS_SPECIAL_SKILL_EFFECT_PER_ATTACK_NODE =
    n => new ReducesDamageFromAttacksDuringCombatByXPercentAsSpecialSkillEffectPerAttackNode(n);

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

const RESTORES_N_HP_TO_UNIT_AFTER_COMBAT_NODE = n => new RestoresHpToUnitAfterCombatNode(n);
const RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE = new RestoresHpToUnitAfterCombatNode(7);
const RESTORES_10_HP_TO_UNIT_AFTER_COMBAT_NODE = new RestoresHpToUnitAfterCombatNode(10);

const WHEN_SPECIAL_TRIGGERS_NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は奥義発動時、奥義以外のスキルによる「ダメージを〇〇%軽減」を無効(ダメージ加算、軽減無効は、範囲奥義を除く)`);
        unit.battleContext.invalidatesDamageReductionExceptSpecialOnSpecialActivation = true;
    }
}();

class ReducesPercentageOfTargetsFoesNonSpecialDamageReductionByNPercentDuringCombatNode extends FromNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let percentage = this.evaluateChildren(env);
        let unit = this.getUnit(env);
        let ratios = unit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial;
        ratios.push(percentage / 100);
        env.debug(`${unit.nameWithGroup}は敵のダメージ軽減を${percentage}%無効。ratios: [${ratios}]`);
    }
}

const REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_N_PERCENT_DURING_COMBAT_NODE =
    n => new ReducesPercentageOfTargetsFoesNonSpecialDamageReductionByNPercentDuringCombatNode(n);
const REDUCES_PERCENTAGE_OF_TARGETS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE
    = new ReducesPercentageOfTargetsFoesNonSpecialDamageReductionByNPercentDuringCombatNode(50);

class ReducesPercentageOfUnitsFoesNonSpecialDamageReductionByNPercentDuringCombatNode extends ReducesPercentageOfTargetsFoesNonSpecialDamageReductionByNPercentDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}


const REDUCES_PERCENTAGE_OF_UNITS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE
    = new ReducesPercentageOfUnitsFoesNonSpecialDamageReductionByNPercentDuringCombatNode(50);
const REDUCES_PERCENTAGE_OF_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE
    = REDUCES_PERCENTAGE_OF_UNITS_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE;

class ReducesPercentageOfFoesFoesNonSpecialDamageReductionByNPercentDuringCombatNode extends ReducesPercentageOfTargetsFoesNonSpecialDamageReductionByNPercentDuringCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const REDUCES_PERCENTAGE_OF_FOES_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE
    = new ReducesPercentageOfFoesFoesNonSpecialDamageReductionByNPercentDuringCombatNode(50);
// 敵の敵は分かりにくいので
const REDUCES_PERCENTAGE_OF_UNITS_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE
    = REDUCES_PERCENTAGE_OF_FOES_FOES_NON_SPECIAL_DAMAGE_REDUCTION_BY_50_PERCENT_DURING_COMBAT_NODE;

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

class FoeCanCounterattackRegardlessOfRangeNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOE_CAN_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE = new FoeCanCounterattackRegardlessOfRangeNode();

class CanTargetCounterattackRegardlessOfRangeNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.canCounterattackToAllDistance;
        env.debug(`${unit.nameWithGroup}は距離に関係なく反撃するか: ${result}`);
        return result;
    }
}

const CAN_TARGET_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE = new CanTargetCounterattackRegardlessOfRangeNode();

class CanFoeCounterattackRegardlessOfRangeNode extends CanTargetCounterattackRegardlessOfRangeNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const CAN_FOE_COUNTERATTACK_REGARDLESS_OF_RANGE_NODE = new CanFoeCounterattackRegardlessOfRangeNode();

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
class TargetAttacksTwiceEvenIfTargetsFoeInitiatesCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は2回攻撃（受けの時も2回攻撃）`);
        unit.battleContext.attackCount = 2;
        unit.battleContext.counterattackCount = 2;
    }
}

const TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE
    = new TargetAttacksTwiceEvenIfTargetsFoeInitiatesCombatNode();
const TARGET_ATTACKS_TWICE_DURING_COMBAT_NODE = TARGET_ATTACKS_TWICE_EVEN_IF_TARGETS_FOE_INITIATES_COMBAT_NODE;

const TARGET_ATTACKS_TWICE_WHEN_TARGET_INITIATES_COMBAT_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は攻撃時に2回攻撃: ${unit.battleContext.attackCount} => 2`);
        unit.battleContext.attackCount = 2;
    }
}();

const TARGET_ATTACKS_TWICE_WHEN_TARGETS_FOE_INITIATES_COMBAT_NODE = new class extends SkillEffectNode {
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

const REDUCES_DAMAGE_FROM_TARGETS_FOES_NEXT_ATTACK_BY_N_PERCENT_ONCE_PER_COMBAT_NODE =
    n => new ReducesDamageFromTargetsFoesNextAttackByNPercentOncePerCombatNode(n);

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

const GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_ATTACK_DURING_COMBAT_NODE =
    n => new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstAttackDuringCombatNode(n);

class GrantsSpecialCooldownCountMinusNToTargetBeforeEachOfTargetsFollowUpAttackDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let result = unit.battleContext.specialCountReductionBeforeEachFollowupAttack += n;
        env.debug(`${unit.nameWithGroup}は自分の各追撃前に自身の奥義発動カウント-${n}: ${result - n} => ${result}`);
    }
}

const GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_EACH_OF_TARGETS_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE =
    n => new GrantsSpecialCooldownCountMinusNToTargetBeforeEachOfTargetsFollowUpAttackDuringCombatNode(n);

class GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstFollowUpAttackDuringCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialCountReductionBeforeFirstFollowupAttack += n;
        let reduction = unit.battleContext.specialCountReductionBeforeFollowupAttack;
        env.debug(`${unit.nameWithGroup}は自分の最初の追撃前に自身の奥義発動カウント-${n}: ${reduction - n} => ${reduction}`);
    }
}

const GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FIRST_FOLLOW_UP_ATTACK_DURING_COMBAT_NODE =
    n => new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFirstFollowUpAttackDuringCombatNode(n);

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

const GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_N_TO_TARGET_BEFORE_TARGETS_FOES_FIRST_ATTACK_DURING_COMBAT_NODE
    = n => new GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstAttackDuringCombatNode(n);

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
        unit.battleContext.specialCountReductionBeforeSecondStrikeByEnemy += n;
        let result = unit.battleContext.specialCountReductionBeforeSecondStrikeByEnemy;
        env.debug(`${unit.nameWithGroup}は相手の最初の2回攻撃の2回目の前に自身の奥義発動カウント-${n}: ${result - n} => ${result}`);
    }
}

/**
 * inflicts Special cooldown count+1 on foe before foe's first attack (cannot exceed the foe's maximum Special cooldown).
 */
class InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstAttackNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let result = foe.battleContext.specialCountIncreaseBeforeFirstAttack += n;
        env.debug(`${unit.nameWithGroup}は敵の最初の攻撃前に敵の奥義発動カウント+${n}: ${result - n} => ${result}`);
    }
}

const INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE =
    n => new InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstAttackNode(n);

class InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesSecondStrikeNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let result = foe.battleContext.specialCountIncreaseBeforeSecondStrike += n;
        env.debug(`${unit.nameWithGroup}は敵の最初の2回攻撃の2回目の攻撃前に敵の奥義発動カウント+${n}: ${result - n} => ${result}`);
    }
}

const INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_SECOND_STRIKE_NODE =
    n => new InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesSecondStrikeNode(n);

class InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstFollowUpAttackNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n) {
        super(n);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let result = foe.battleContext.specialCountIncreaseBeforeFollowupAttack += n;
        env.debug(`${unit.nameWithGroup}は敵の最初の追撃前に敵の奥義発動カウント+${n}: ${result - n} => ${result}`);
    }
}

const INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FOES_FIRST_FOLLOW_UP_ATTACK_NODE =
    n => new InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFoesFirstFollowUpAttackNode(n);

class InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFirstAttackNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n) {
        super(n);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let result = foe.battleContext.specialCountIncreaseBeforeFirstAttackByEnemy += n;
        env.debug(`${unit.nameWithGroup}は最初の攻撃前に敵の奥義発動カウント+${n}: ${result - n} => ${result}`);
    }
}

const INFLICTS_SPECIAL_COOLDOWN_COUNT_PLUS_N_ON_TARGETS_FOE_BEFORE_TARGETS_FIRST_ATTACK_NODE =
    n => new InflictsSpecialCooldownCountPlusNOnTargetsFoeBeforeTargetsFirstAttackNode(n);

class GrantsSpecialCooldownCountMinusNToUnitBeforeFoesFirstAttackDuringCombatNode
    extends GrantsSpecialCooldownCountMinusNToTargetBeforeTargetsFoesFirstAttackDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

class TargetCanActivateNonSpecialMiracleNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} threshold
     */
    constructor(threshold) {
        super(NumberNode.makeNumberNodeFrom(threshold));
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.canActivateNonSpecialMiracle = true;
        let threshold = this.evaluateChildren(env);
        unit.battleContext.nonSpecialMiracleHpPercentageThreshold = threshold;
        env.debug(`HP${threshold}%以上の時${unit.nameWithGroup}は奥義以外の祈りを発動可能`);
    }
}

/**
 * HP n%以上の時奥義以外の祈り
 * @param {number} thresholdPercentage %
 * @returns {TargetCanActivateNonSpecialMiracleNode}
 * @constructor
 */
const TARGET_CAN_ACTIVATE_NON_SPECIAL_MIRACLE_NODE = thresholdPercentage => new TargetCanActivateNonSpecialMiracleNode(thresholdPercentage);

// TODO: if foe's first attack triggers the "attacks twice" effect, grants Special cooldown count-1 to unit before foe's second strike as well

/**
 * Effective against
 */
class EffectiveAgainstNode extends SkillEffectNode {
    constructor(...n) {
        super(...n.map(n => NumberNode.makeNumberNodeFrom(n)));
    }

    evaluate(env) {
        let unit = env.unitDuringCombat;
        for (let effective of this.evaluateChildren(env)) {
            unit.battleContext.effectivesAgainst.push(effective);
            env.debug(`${unit.nameWithGroup}は${EFFECTIVE_TYPE_NAMES.get(effective)}特効`);
        }
    }
}

const EFFECTIVE_AGAINST_NODE = (...n) => new EffectiveAgainstNode(...n);

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

const NEUTRALIZES_EFFECTS_THAT_PREVENT_TARGETS_COUNTERATTACKS_DURING_COMBAT_NODE =
    new NeutralizesEffectsThatPreventTargetsCounterattacksDuringCombatNode();

/**
 * when unit deals damage to foe during combat, restores 7 HP to unit (triggers even if 0 damage is dealt).
 */
class WhenTargetDealsDamageDuringCombatRestoresNHpToTargetNode extends FromPositiveNumberNode {
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

const WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_TO_TARGET_NODE =
    n => new WhenTargetDealsDamageDuringCombatRestoresNHpToTargetNode(n);

/**
 * when unit deals damage to foe during combat, restores 7 HP to unit (triggers even if 0 damage is dealt).
 */
class WhenTargetDealsDamageDuringCombatRestoresNHpPerAttackToTargetNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = this.evaluateChildren(env);
        unit.battleContext.healedHpByAttackPerAttack += result;
        env.debug(`${unit.nameWithGroup}は自分の攻撃でダメージを与えた時、${result}回復（与えたダメージが0でも効果は発動）`);
    }
}

const WHEN_TARGET_DEALS_DAMAGE_DURING_COMBAT_RESTORES_N_HP_PER_ATTACK_TO_TARGET_NODE =
    n => new WhenTargetDealsDamageDuringCombatRestoresNHpPerAttackToTargetNode(n);

class NeutralizeReducesDamageByXPercentEffectsFromTargetsFoesNonSpecialNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.invalidatesDamageReductionExceptSpecial = true;
        env.debug(`${unit.nameWithGroup}は相手の奥義以外のダメージ軽減を無効`);
    }
}

const NEUTRALIZE_REDUCES_DAMAGE_BY_X_PERCENT_EFFECTS_FROM_TARGETS_FOES_NON_SPECIAL_NODE =
    new NeutralizeReducesDamageByXPercentEffectsFromTargetsFoesNonSpecialNode();

const NEUTRALIZE_REDUCES_DAMAGE_BY_X_PERCENT_EFFECTS_FROM_FOES_NON_SPECIAL_NODE =
    new class extends NeutralizeReducesDamageByXPercentEffectsFromTargetsFoesNonSpecialNode {
        static {
            Object.assign(this.prototype, GetUnitDuringCombatMixin);
        }
    }();

const NEUTRALIZE_REDUCES_DAMAGE_BY_X_PERCENT_EFFECTS_FROM_UNITS_NON_SPECIAL_NODE =
    new class extends NeutralizeReducesDamageByXPercentEffectsFromTargetsFoesNonSpecialNode {
        static {
            Object.assign(this.prototype, GetFoeDuringCombatMixin);
        }
    }();

class NeutralizeReducesDamageByXPercentEffectsFromTargetsFoesNonSpecialAfterDefenderSpecialNode extends SkillEffectNode {
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
        unit.battleContext.firstAttackReflexDamageRates.push(1.0);
        env.debug(`${unit.nameWithGroup}は敵の最初の攻撃で軽減した値を、自身の次の攻撃のダメージに+`);
    }
}

const TARGETS_NEXT_ATTACK_DEALS_DAMAGE_EQ_TOTAL_DAMAGE_REDUCED_FROM_TARGETS_FOES_FIRST_ATTACK_NODE =
    new TargetsNextAttackDealsDamageEqTotalDamageReducedFromTargetsFoesFirstAttackNode();

/**
 * 最初に攻撃を受けた時、戦闘中、軽減前のダメージの30%を自身の次の攻撃のダメージに+(その戦闘中のみ。同系統効果複数時、最大値適用)
 * and unit's next attack deals damage = 40% of foe's attack damage prior to reductions
 * (resets at end of combat; only highest value applied; does not stack).
 */
class TargetsNextAttackDealsDamageXPercentOfTargetsForesAttackPriorToReductionOnlyHighestValueAppliedAndDoesNotStackNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = env.unitDuringCombat;
        let percentage = this.evaluateChildren(env);
        let ratio = percentage / 100.0;
        let result = unit.battleContext.reducedRatioForNextAttack = Math.max(ratio, unit.battleContext.reducedRatioForNextAttack);
        env.debug(`${unit.nameWithGroup}は軽減前のダメージの${percentage}%を自身の次の攻撃のダメージに+(同系統効果複数時、最大値適用): ${result}`);
    }
}

const TARGETS_NEXT_ATTACK_DEALS_DAMAGE_X_PERCENT_OF_TARGETS_FORES_ATTACK_PRIOR_TO_REDUCTION_ONLY_HIGHEST_VALUE_APPLIED_AND_DOES_NOT_STACK_NODE
    = n => new TargetsNextAttackDealsDamageXPercentOfTargetsForesAttackPriorToReductionOnlyHighestValueAppliedAndDoesNotStackNode(n);

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

const RESTORES_X_HP_TO_TARGET_AS_TARGETS_COMBAT_BEGINS_NODE = n => new RestoresXHPToTargetAsTargetsCombatBeginsNode(n);
// restores 40% of unit’s maximum HP
// as unit’s combat begins for 1 turn
// (triggers after effects that deal damage as combat begins;
// only highest value applied; does not stack).
const RESTORES_N_PERCENT_OF_TARGETS_MAX_HP_AS_TARGETS_COMBAT_BEGINS_NODE =
    percentage => RESTORES_X_HP_TO_TARGET_AS_TARGETS_COMBAT_BEGINS_NODE(
        PERCENTAGE_NODE(percentage, TARGETS_MAX_HP_NODE));


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

const REDUCES_EFFECT_OF_DEEP_WOUNDS_ON_TARGET_BY_X_PERCENT_DURING_COMBAT_NODE =
    n => new ReducesEffectOfDeepWoundsOnTargetByXPercentDuringCombatNode(n);

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

const CALCULATES_DAMAGE_USING_THE_LOWER_OF_TARGETS_FOES_DEF_OR_RES_WHEN_SPECIAL_TRIGGERS_NODE =
    new CalculatesDamageUsingTheLowerOfTargetsFoesDefOrResWhenSpecialTriggersNode();

class InflictsBonusReversalPenaltyOnTargetsFoeNode extends FromBoolStatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let booleans = this.evaluateChildren(env);
        foe.battleContext.setBonusReversals(...booleans);
        env.debug(`${foe.nameWithGroup}は強化反転を受ける: [${booleans}]`);
    }
}

class DisablesTargetsFoesSkillsThatCalculateDamageUsingTheLowerOfTargetsFoesDefOrResDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.invalidatesReferenceLowerMit = true;
        env.debug(`${unit.nameWithGroup}は敵の「敵の守備か魔防の低い方でダメージ計算」を無効化`);
    }
}

const DISABLES_TARGETS_FOES_SKILLS_THAT_CALCULATE_DAMAGE_USING_THE_LOWER_OF_TARGETS_FOES_DEF_OR_RES_DURING_COMBAT_NODE =
    new DisablesTargetsFoesSkillsThatCalculateDamageUsingTheLowerOfTargetsFoesDefOrResDuringCombatNode();

// Unit or BattleContextに値を設定 END

class CanTargetMakeFollowUpIncludingPotentNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        if (!env.isAtOrAfterCombatPhase(NodeEnv.COMBAT_PHASE.AFTER_FOLLOWUP_CONFIGURED)) {
            env.error(`追撃可能判定が終了していません。phase: ${ObjectUtil.getKeyName(NodeEnv.COMBAT_PHASE, env.combatPhase)}`);
        }
        let unit = this.getUnit(env);
        let result = unit.battleContext.canFollowupAttackIncludingPotent();
        env.debug(`${unit.nameWithGroup}は追撃可能か: ${result}`);
        return result;
    }
}

const CAN_TARGET_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE = new CanTargetMakeFollowUpIncludingPotentNode();

/**
 * 神速は含まない
 */
class CanTargetMakeFollowUpNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        if (!env.isAtOrAfterCombatPhase(NodeEnv.COMBAT_PHASE.AFTER_FOLLOWUP_CONFIGURED)) {
            env.error(`追撃可能判定が終了していません。phase: ${ObjectUtil.getKeyName(NodeEnv.COMBAT_PHASE, env.combatPhase)}`);
        }
        let unit = this.getUnit(env);
        let result = unit.battleContext.canFollowupAttackWithoutPotent;
        env.debug(`${unit.nameWithGroup}は追撃可能か: ${result}`);
        return result;
    }
}

const CAN_TARGET_MAKE_FOLLOW_UP_NODE = new CanTargetMakeFollowUpNode();

class CanTargetsFoeMakeFollowUpIncludingPotentNode extends CanTargetMakeFollowUpIncludingPotentNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const CAN_TARGETS_FOE_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE = new CanTargetsFoeMakeFollowUpIncludingPotentNode();

// TODO: 命名規則を統一させる
class DoesTargetTriggerAttacksTwiceNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は2回攻撃を発動しているか";

    getValue(unit) {
        return unit.battleContext.isTriggeringAttackTwice();
    }
}

const DOES_TARGET_TRIGGER_ATTACKS_TWICE_NODE = new DoesTargetTriggerAttacksTwiceNode();

class DoesTargetsFoeTriggerAttacksTwiceNode extends DoesTargetTriggerAttacksTwiceNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class CanTargetAttackDuringCombatNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は攻撃可能か";

    getValue(unit, env) {
        if (env.combatPhase !== NodeEnv.COMBAT_PHASE.NULL_PHASE &&
            !env.isAfterCombatPhase(NodeEnv.COMBAT_PHASE.APPLYING_CAN_COUNTER)) {
            env.error(`反撃可能判定が終わっていません(current phase: ${ObjectUtil.getKeyName(NodeEnv.COMBAT_PHASE, 1)})`);
        }
        return unit.battleContext.canAttackInCombat();
    }
}

const CAN_TARGET_ATTACK_DURING_COMBAT_NODE = new CanTargetAttackDuringCombatNode();

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

class DamageDealtToFoeAsCombatBeginsNode extends DamageDealtToTargetAsCombatBeginsNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class DealsDamageToTargetAsCombatBeginsNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let result = unit.battleContext.damageAfterBeginningOfCombat += n;
        env.debug(`${unit.nameWithGroup}は戦闘開始後${n}ダメージ: ${result - n} -> ${result}`);
    }
}

const DEALS_DAMAGE_TO_TARGET_AS_COMBAT_BEGINS_NODE = n => new DealsDamageToTargetAsCombatBeginsNode(n);

class DealsDamageToFoeAsCombatBeginsNode extends DealsDamageToTargetAsCombatBeginsNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class DealsDamageToTargetAsCombatBeginsThatDoesNotStackNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.addDamageAfterBeginningOfCombatNotStack(n);
        let result = unit.battleContext.getDamagesAfterBeginningOfCombatNotStack();
        env.debug(`${unit.nameWithGroup}は戦闘開始後${n}ダメージ（最大値適用）: ${result}`);
    }
}

class DealsDamageToFoeAsCombatBeginsThatDoesNotStackNode extends DealsDamageToTargetAsCombatBeginsThatDoesNotStackNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
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

const APPLY_SKILL_EFFECTS_AFTER_STATUS_FIXED_NODE =
    (...nodes) => new AppliesSkillEffectsAfterStatusFixedNode(...nodes);

class TargetAppliesSkillEffectsPerAttackNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {DamageCalculatorEnv|NodeEnv} env
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let node = new SkillEffectNode(...this.getChildren());
        env.debug(`${unit.nameWithGroup}の攻撃ごとのスキル効果を設定`);
        unit.battleContext.applySkillEffectPerAttackNodes.push(node);
    }
}

const TARGET_APPLIES_SKILL_EFFECTS_PER_ATTACK_NODE =
    (...nodes) => new TargetAppliesSkillEffectsPerAttackNode(...nodes);

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
class CalculatesDamageUsingXPercentOfTargetsStatInsteadOfAtkWhenSpecialNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(index, percentage) {
        super();
        this._indexNode = NumberNode.makeNumberNodeFrom(index);
        this._percentageNode = NumberNode.makeNumberNodeFrom(percentage);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let index = this._indexNode.evaluate(env);
        let percentage = this._percentageNode.evaluate(env);
        unit.battleContext.statIndexInsteadOfAtkWhenSpecial = index;
        unit.battleContext.ratioForUsingAnotherStatWhenSpecial = percentage / 100.0;
        env.debug(`${unit.nameWithGroup}は奥義発動時攻撃の代わりに${getStatusName(index)}の値を使用(${percentage}%)`);
    }
}

const CALCULATES_DAMAGE_USING_X_PERCENT_OF_TARGETS_STAT_INSTEAD_OF_ATK_WHEN_SPECIAL_NODE =
    (index, percentage) => new CalculatesDamageUsingXPercentOfTargetsStatInsteadOfAtkWhenSpecialNode(index, percentage);

/**
 * any "reduces damage by X%" effect that can be triggered only once per combat by unit's equipped Special skill can be triggered up to twice per combat (excludes boosted Special effects from engaging; only highest value applied; does not stack),
 */
class AnyTargetsReduceDamageEffectOnlyOnceCanBeTriggeredUpToNTimesPerCombatNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.addAdditionalNTimesDamageReductionRatiosByNonDefenderSpecialCount(n);
        env.debug(`${unit.nameWithGroup}は1戦闘1回の奥義スキルが持つダメージ軽減の発動回数を${n}回増加（${n + 1}回発動）}`);
    }
}

const ANY_TARGETS_REDUCE_DAMAGE_EFFECT_ONLY_ONCE_CAN_BE_TRIGGERED_UP_TO_N_TIMES_PER_COMBAT_NODE =
    n => new AnyTargetsReduceDamageEffectOnlyOnceCanBeTriggeredUpToNTimesPerCombatNode(n);

/**
 * Grants weapon-triangle advantage against colorless foes and inflicts weapon-triangle disadvantage on colorless foes during combat.
 */
class GrantsTriangleAdvantageAgainstColorlessTargetsFoesAndInflictsTriangleDisadvantageOnColorlessTargetsFoesDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.isAdvantageForColorless = true;
        env.debug(`${unit.nameWithGroup}は無属性の敵との戦闘時自分は3すくみ有利、敵は3すくみ不利となる`);
    }
}

const GRANTS_TRIANGLE_ADVANTAGE_AGAINST_COLORLESS_TARGETS_FOES_AND_INFLICTS_TRIANGLE_DISADVANTAGE_ON_COLORLESS_TARGETS_FOES_DURING_COMBAT_NODE
    = new GrantsTriangleAdvantageAgainstColorlessTargetsFoesAndInflictsTriangleDisadvantageOnColorlessTargetsFoesDuringCombatNode();

class AtStartOfPlayerPhaseOrEnemyPhaseNeutralizesStatusEffectThatTakeEffectOnTargetAtThatTimeNode extends FromNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let e = this.evaluateChildren(env);
        unit.battleContext.neutralizedStatusEffectSetWhileBeginningOfTurn.add(e);
        env.debug(`${unit.nameWithGroup}は付与される${getStatusEffectName(e)}を無効化`);
    }
}

class AtStartOfPlayerPhaseOrEnemyPhaseNeutralizesPenaltiesThatTakeEffectOnTargetAtThatTimeNode extends FromBoolStatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.neutralizedDebuffFlagsWhileBeginningOfTurn = this.evaluateChildren(env);
        env.debug(`${unit.nameWithGroup}は付与される弱化を無効化: [${result}]`);
    }
}

class PotentFollowXPercentageHasTriggeredAndXLte99ThenXIsNNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {boolean|BoolNode} isPerAttack
     */
    constructor(n, isPerAttack = FALSE_NODE) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._isPerAttackNode = BoolNode.makeBoolNodeFrom(isPerAttack);
    }

    evaluate(env) {
        /** @type {Unit} */
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        if (this._isPerAttackNode.evaluate(env)) {
            unit.battleContext.potentOverwriteRatioPerAttack = n / 100.0;
        } else {
            unit.battleContext.potentOverwriteRatio = n / 100.0;
        }
        env.debug(`${unit.nameWithGroup}は神速追撃発動時に神速追撃${n}%とする`);
    }
}

const POTENT_FOLLOW_X_PERCENTAGE_HAS_TRIGGERED_AND_X_LTE_99_THEN_X_IS_N_NODE =
    x => new PotentFollowXPercentageHasTriggeredAndXLte99ThenXIsNNode(x);

class CalculatesTargetsDamageFromStaffLikeOtherWeaponsNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.wrathfulStaff = true;
        env.debug(`${unit.nameWithGroup}は他の武器同様のダメージ計算になる`);
    }
}

const CALCULATES_TARGETS_DAMAGE_FROM_STAFF_LIKE_OTHER_WEAPONS_NODE =
    new CalculatesTargetsDamageFromStaffLikeOtherWeaponsNode();

class IsTargetsSaviorTriggeredNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.isSaviorActivated;
        env.debug(`${unit.nameWithGroup}は護り手を発動中か: ${result}`);
        return result;
    }
}

const IS_TARGETS_SAVIOR_TRIGGERED_NODE = new IsTargetsSaviorTriggeredNode();

class TargetCanCounterattackBeforeTargetsFoesFirstAttackNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.isVantageActivatable = true;
        env.debug(`${unit.nameWithGroup}は敵から攻撃された時、先制攻撃`);
    }
}

const TARGET_CAN_COUNTERATTACK_BEFORE_TARGETS_FOES_FIRST_ATTACK_NODE =
    new TargetCanCounterattackBeforeTargetsFoesFirstAttackNode()

class TargetNeutralizesEffectiveAgainstXNode extends FromPositiveNumbersNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let es = this.evaluateChildren(env);
        for (let e of es) {
            unit.battleContext.invalidatedEffectives.push(e);
            env.debug(`${unit.nameWithGroup}は${EFFECTIVE_TYPE_NAMES.get(e)}特攻を無効`);
        }
    }
}

const TARGET_NEUTRALIZES_EFFECTIVE_AGAINST_X_NODE =
    (...e) => new TargetNeutralizesEffectiveAgainstXNode(...e);

class SetTargetsBanePerAttackNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.isBanePerAttack = true;
        env.debug(`${unit.nameWithGroup}は瞬殺を発動`);
    }
}

const SET_TARGETS_BANE_PER_ATTACK_NODE = new SetTargetsBanePerAttackNode();

class TreatsTargetsFoesDefResAsIfReducedByXPercentNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.battleContext.specialSufferPercentage = n;
        env.debug(`${unit.nameWithGroup}は敵の守備、魔防-${n}%扱いで攻撃`);
    }
}

const TREATS_TARGETS_FOES_DEF_RES_AS_IF_REDUCED_BY_X_PERCENT_NODE =
    n => new TreatsTargetsFoesDefResAsIfReducedByXPercentNode(n);

class DoesNotTriggerTargetsFoesSaviorEffectsNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.doesNotTriggerFoesSaviorEffects = true;
        env.debug(`${unit.nameWithGroup}の戦闘時、敵の護り手は発動しない`);
    }
}

const DOES_NOT_TRIGGER_TARGETS_FOES_SAVIOR_EFFECTS_NODE = new DoesNotTriggerTargetsFoesSaviorEffectsNode();

class GrantsMiracleAndHealToTargetOncePerMapNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        if (g_appData.globalBattleContext.miracleAndHealWithoutSpecialActivationCount[unit.groupId] === 0) {
            unit.battleContext.canActivateNonSpecialMiracleAndHeal = true;
        }
    }
}

const GRANTS_MIRACLE_AND_HEAL_TO_TARGET_ONCE_PER_MAP_NODE = new GrantsMiracleAndHealToTargetOncePerMapNode();

class TargetCannotRecoverHpDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.hasDeepWounds = true;
        env.debug(`${unit.nameWithGroup}は戦闘中HPを回復できない`);
    }
}

const TARGET_CANNOT_RECOVER_HP_DURING_COMBAT_NODE = new TargetCannotRecoverHpDuringCombatNode();

class FoeCannotRecoverHpDuringCombatNode extends TargetCannotRecoverHpDuringCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOE_CANNOT_RECOVER_HP_DURING_COMBAT_NODE = new FoeCannotRecoverHpDuringCombatNode();

class TargetCannotRecoverHpAfterCombatNeutralizedWhenFeudNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.hasDeepWoundsAfterCombatNeutralizedWhenFeud = true;
        env.debug(`${unit.nameWithGroup}は戦闘後HPを回復できない（暗闘で無効化される）`);
    }
}

const TARGET_CANNOT_RECOVER_HP_AFTER_COMBAT_NEUTRALIZED_WHEN_FEUD_NODE =
    new TargetCannotRecoverHpAfterCombatNeutralizedWhenFeudNode();

const FOE_CANNOT_RECOVER_HP_AFTER_COMBAT_NEUTRALIZED_WHEN_FEUD_NODE =
    new class extends TargetCannotRecoverHpAfterCombatNeutralizedWhenFeudNode {
        static {
            Object.assign(this.prototype, GetFoeDuringCombatMixin);
        }
    }

class ReducesEffectOfDeepWoundsOnTargetByNPercentNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let value = this.evaluateChildren(env);
        let ratio = value / 100.0;
        unit.battleContext.addNullInvalidatesHealRatios(ratio);
        env.debug(`${unit.nameWithGroup}は回復不可を${value}%無効`);
    }
}

const REDUCES_EFFECT_OF_DEEP_WOUNDS_ON_TARGET_BY_N_PERCENT_NODE =
    n => new ReducesEffectOfDeepWoundsOnTargetByNPercentNode(n);

const NEUTRALIZES_TARGETS_DEEP_WOUNDS_DURING_COMBAT_NODE =
    new ReducesEffectOfDeepWoundsOnTargetByNPercentNode(100);

class NeutralizesTargetFoesNonSpecialMiracle extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.neutralizesNonSpecialMiracle = true;
        env.debug(`${unit.nameWithGroup}は相手の奥義以外の祈りを無効`);
    }
}

const NEUTRALIZES_TARGET_FOES_NON_SPECIAL_MIRACLE = new NeutralizesTargetFoesNonSpecialMiracle();

class CalculatesDamageAtNPercentNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let percentage = this.evaluateChildren(env);
        unit.battleContext.damageCalculationRatios.push(percentage / 100.0);
        env.debug(`${unit.nameWithGroup}は与えるダメージを${percentage}%で計算`);
    }
}

/**
 * @param {number|NumberNode} n
 */
const CALCULATES_DAMAGE_AT_N_PERCENT_NODE = (n) => new CalculatesDamageAtNPercentNode(n);

class AfterCombatMovementEffectsDoNotOccurBecauseOfTargetNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.isAfterCombatMovementDisabled = true;
        env.debug(`${unit.nameWithGroup}は戦闘後移動スキルを無効にする`);
    }
}

const AFTER_COMBAT_MOVEMENT_EFFECTS_DO_NOT_OCCUR_BECAUSE_OF_TARGET_NODE =
    new AfterCombatMovementEffectsDoNotOccurBecauseOfTargetNode();

class CancelsStatusEffectsGrantedToTargetNode extends FromNumbersNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        this.evaluateChildren(env).forEach(e => {
            let unit = this.getUnit(env);
            env.debug(`${unit.nameWithGroup}の${getStatusEffectName(e)}を解除予約`);
            unit.reservedStatusEffectSetToNeutralize.add(e);
        });
    }
}

const CANCELS_STATUS_EFFECTS_GRANTED_TO_TARGET_NODE =
    (...effects) => new CancelsStatusEffectsGrantedToTargetNode(...effects);
const NEUTRALIZES_STATUS_EFFECT_GRANTED_TO_TARGET_NODE = CANCELS_STATUS_EFFECTS_GRANTED_TO_TARGET_NODE;

class HasTargetActivatedSpecialMiracleNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.hasSpecialMiracleActivated;
        env.debug(`${unit.nameWithGroup}は奥義の祈りを発動したか: ${result}`);
        return result;
    }
}

const HAS_TARGET_ACTIVATED_SPECIAL_MIRACLE_NODE = new HasTargetActivatedSpecialMiracleNode();

class ReducesDamageFromTargetFoeToZeroNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.battleContext.reducesDamageFromFoeToZeroDuringCombat = true;
        env.debug(`${unit.nameWithGroup}はダメージを0に軽減`);
    }
}

const REDUCES_DAMAGE_FROM_TARGET_FOE_TO_ZERO_NODE = new ReducesDamageFromTargetFoeToZeroNode();

class ReducesDamageFromTargetToZeroNode extends ReducesDamageFromTargetFoeToZeroNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const REDUCES_DAMAGE_FROM_TARGET_TO_ZERO_NODE = new ReducesDamageFromTargetToZeroNode();
