// TODO: 遅延評価のためのMap作成

/**
 * @template K
 * @template V
 * @extends {Map<K, V>}
 */
class MultiValueMap extends Map {
    /**
     * @param {K} key
     * @param {V} value
     */
    addValue(key, value) {
        if (!this.has(key)) {
            this.set(key, []); // 新しいキーの場合、空の配列をセット
        }
        this.get(key).push(value); // 配列に値を追加
    }

    /**
     * @returns {V[]}
     */
    getValues(key) {
        return this.get(key) || [];
    }
}

/**
 * @template {SkillEffectNode} N
 * @template E
 */
class SkillEffectHooks {
    /** @type {MultiValueMap<number|string, () => N>} */
    #delayedMap = new MultiValueMap();
    /** @type {MultiValueMap<number|string, N>} */
    #instantiatedMap = new MultiValueMap();

    /**
     * @param {number|string} skillId
     * @param {() => N} nodeFunc
     */
    addSkill(skillId, nodeFunc) {
        if (typeof nodeFunc !== 'function') {
            throw new Error('Argument nodeFunc must be a function');
        }
        this.#delayedMap.addValue(skillId, nodeFunc);
    }

    /**
     * @param {number|string} skillId
     * @return N[]
     */
    getSkills(skillId) {
        this.#delayedMap.getValues(skillId).forEach(nodeFunc => this.#instantiatedMap.addValue(skillId, nodeFunc()));
        this.#delayedMap.delete(skillId);
        return this.#instantiatedMap.getValues(skillId);
    }

    /**
     * @param {number|string} skillId
     * @param {E} env
     * @return {*[]}
     */
    evaluate(skillId, env) {
        return this.getSkills(skillId).map(skillNode => skillNode.evaluate(env));
    }

    /**
     * @param {number|string} skillId
     * @param {E} env
     * @returns boolean
     */
    evaluateSome(skillId, env) {
        return this.evaluate(skillId, env).some(result => result);
    }

    /**
     * @param {number|string} skillId
     * @param {E} env
     * @returns number
     */
    evaluateNumber(skillId, env) {
        let results = this.evaluate(skillId, env);
        if (results.length > 0) {
            return results[results.length - 1];
        }
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {*[][]}
     */
    evaluateWithUnit(unit, env) {
        return Array.from(unit.enumerateSkills()).map(skillId => this.evaluate(skillId, env));
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {boolean}
     */
    evaluateSomeWithUnit(unit, env) {
        return Array.from(unit.enumerateSkills()).some(skillId => this.evaluateSome(skillId, env));
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {number}
     */
    evaluateMaxWithUnit(unit, env) {
        /** @type {(number|string)[]} */
        let skillIds = Array.from(unit.enumerateSkills());
        let evaluate = skillId => this.evaluateNumber(skillId, env) ?? Number.NEGATIVE_INFINITY;
        return Math.max(...skillIds.map(evaluate));
    }
}

class SkillEffectNode {
    /** @type {SkillEffectNode} */
    _parent = null;
    /** @type {SkillEffectNode[]} */
    _children = []
    /** @type {number | string} */
    _skillId;
    /** @type {string} */
    _skillName;

    constructor(...children) {
        this.addChildren(...children);
    }

    setSkill(skillId, skillName) {
        this._skillId = skillId;
        this._skillName = skillName;
    }

    evaluate() {
        return this.evaluateChildren(...arguments);
    }

    evaluateChildren() {
        return this._children.map(child => child.evaluate(...arguments));
    }

    addParent(node) {
        this._parent = node;
    }

    /**
     * @param {SkillEffectNode} node
     */
    addChild(node) {
        this._children.push(node);
        node.addParent(this);
    }

    /**
     * @param {...SkillEffectNode} children
     */
    addChildren(...children) {
        for (const child of children) {
            this._children.push(child);
        }
    }

    getChildren() {
        return this._children;
    }
}

/**
 * @abstract
 */
class NumberNode extends SkillEffectNode {
    /**
     * @abstract
     * @returns {number}
     */
    evaluate(env) {
        return super.evaluate(env);
    }
}

/**
 * @abstract
 */
class FromNumberNode extends SkillEffectNode {
    /**
     * @param {number|NumberNode} numberOrNode
     */
    constructor(numberOrNode) {
        if (typeof numberOrNode === 'number') {
            super(new ConstantNumberNode(numberOrNode));
        } else {
            super(numberOrNode);
        }
    }

    /**
     * @returns {number}
     */
    evaluateChildren(env) {
        return super.evaluateChildren(env)[0];
    }

    /**
     * @abstract
     */
    evaluate(env) {
    }
}

/**
 * @abstract
 */
class FromNumbersNode extends SkillEffectNode {
    /**
     * @param {...number|NumberNode} numerics
     */
    constructor(...numerics) {
        super();
        numerics.forEach(n => {
                if (typeof n === 'number') {
                    this.addChildren(new ConstantNumberNode(n));
                } else {
                    this.addChildren(n);
                }
            }
        );
    }

    /**
     * @abstract
     */
    evaluate(env) {
        super.evaluateChildren(env);
    }
}

class FromPositiveNumberNode extends FromNumberNode {
    evaluateChildren(env) {
        let value = super.evaluateChildren(env);
        if (value < 0) {
            throw new Error('Children must be a positive number');
        }
        return value;
    }
}

class FromPositiveNumbersNode extends FromNumbersNode {
    evaluateChildren(env) {
        let evaluatedValues = super.evaluateChildren(env);
        if (evaluatedValues.some(value => value < 0)) {
            throw new Error('Children must be a positive number');
        }
        return evaluatedValues;
    }
}

class ConstantNumberNode extends NumberNode {
    #value;

    constructor(value) {
        super();
        this.#value = value;
    }

    /**
     * @returns {number}
     */
    evaluate(env) {
        return this.#value;
    }
}

/**
 * @abstract
 */
class BoolNode extends SkillEffectNode {
    /**
     * @abstract
     * @returns {boolean} */
    evaluate(env) {
    }
}

class AndNode extends BoolNode {
    evaluate(env) {
        return this.getChildren().every(child => child.evaluate(env));
    }
}

class OrNode extends BoolNode {
    evaluate(env) {
        return this.getChildren().some(child => child.evaluate(env));
    }
}

class BoolToBoolNode extends BoolNode {
    /**
     * @param {boolean|BoolNode} value
     */
    constructor(value) {
        if (typeof value === 'boolean') {
            super(value ? TRUE_NODE : FALSE_NODE);
        } else {
            super(value);
        }
    }

    /**
     * @returns {boolean}
     */
    evaluateChildren(env) {
        return super.getChildren()[0].evaluate(env);
    }

    evaluate(env) {
        return this.evaluateChildren(env);
    }
}

const TRUE_NODE = new class extends BoolNode {
    evaluate(env) {
        return true;
    }
}();

const FALSE_NODE = new class extends BoolNode {
    evaluate(env) {
        return false;
    }
}();

/**
 * @abstract
 */
class NumberOperationNode extends NumberNode {
    /**
     * @param {...(number|NumberNode)} values
     */
    constructor(...values) {
        super();
        values.forEach(value => {
                let v = typeof value === 'number' ? new ConstantNumberNode(value) : value;
                this.addChild(v);
            }
        );
    }

    /**
     * @abstract
     * @returns {number}
     */
    evaluate(env) {
    }
}

class EnsureMaxNode extends NumberOperationNode {
    #max = Number.MAX_SAFE_INTEGER;

    /**
     * @param {number|NumberNode} child
     * @param {number} max
     */
    constructor(child, max) {
        super(child);
        this.#max = max;
    }

    evaluateChildren(env) {
        return super.evaluateChildren(env)[0];
    }

    evaluate(env) {
        return MathUtil.ensureMax(this.evaluateChildren(env), this.#max);
    }
}

class EnsureMinMaxNode extends NumberOperationNode {
    #min = Number.MIN_SAFE_INTEGER;
    #max = Number.MAX_SAFE_INTEGER;

    /**
     * @param {number|NumberNode} child
     * @param {number} min
     * @param {number} max
     */
    constructor(child, min, max) {
        super(child);
        this.#min = min;
        this.#max = max;
    }

    evaluateChildren(env) {
        return super.evaluateChildren(env)[0];
    }

    evaluate(env) {
        return MathUtil.ensureMinMax(this.evaluateChildren(env), this.#min, this.#max);
    }
}

class AddNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        return super.evaluateChildren(env).reduce((a, b) => a + b);
    }
}

class MultNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        return super.evaluateChildren(env).reduce((a, b) => a * b);
    }
}

class MultTruncNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        return super.evaluateChildren(env).reduce((a, b) => Math.trunc(a * b));
    }
}

class IfNode extends SkillEffectNode {
    /** @type {BoolNode} */
    #condNode;

    constructor(condNode, ...stmtNodes) {
        super(...stmtNodes);
        this.#condNode = condNode;
    }

    evaluate(env) {
        if (this.#condNode.evaluate(env)) {
            return super.evaluate(env);
        }
    }
}

// TODO: 別ファイルに分ける

class DamageCalculatorWrapperEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {boolean|null} calcPotentialDamage
     */
    constructor(damageCalculator, targetUnit, enemyUnit, calcPotentialDamage) {
        this.damageCalculator = damageCalculator;
        this.targetUnit = targetUnit;
        this.enemyUnit = enemyUnit;
        this.calcPotentialDamage = calcPotentialDamage;
    }
}

class BattleSimulatorBaseEnv {
    /**
     * @param {BattleSimulatorBase} battleSimulatorBase
     * @param {Unit} targetUnit
     */
    constructor(battleSimulatorBase, targetUnit) {
        this.battleSimulatorBase = battleSimulatorBase;
        this.targetUnit = targetUnit;
    }
}

class AddStatusEffectEnv {
    /**
     * @param {Unit} targetUnit
     * @param {Unit} allyOrUnit
     * @param {number} statusEffect
     */
    constructor(targetUnit, allyOrUnit, statusEffect) {
        this.targetUnit = targetUnit;
        this.allyOrUnit = allyOrUnit;
        this.statusEffect = statusEffect;
    }
}

class NeutralizingEndActionEnv {
    /**
     * @param {Unit} targetUnit
     * @param {Unit} allyOrUnit
     */
    constructor(targetUnit, allyOrUnit) {
        this.targetUnit = targetUnit;
        this.allyOrUnit = allyOrUnit;
    }
}

const UNIT_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.cannotTriggerPrecombatSpecial = true;
    }
}();

const FOE_CANNOT_TRIGGER_AREA_OF_EFFECT_SPECIALS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.cannotTriggerPrecombatSpecial = true;
    }
}();

const UNIT_DISABLES_DEFENSIVE_TERRAIN_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.invalidatesDefensiveTerrainEffect = true;
    }
}();

const FOE_DISABLES_DEFENSIVE_TERRAIN_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.invalidatesDefensiveTerrainEffect = true;
    }
}();

const UNIT_DISABLES_SUPPORT_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.invalidatesSupportEffect = true;
    }
}();

const FOE_DISABLES_SUPPORT_EFFECTS = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.invalidatesSupportEffect = true;
    }
}();

class CantoEnv {
    /**
     * @param {Unit} targetUnit
     */
    constructor(targetUnit) {
        this.targetUnit = targetUnit;
    }
}

class CantoControlEnv {
    /**
     * @param {Unit} targetUnit
     * @param {Unit} unitThatControlCanto
     */
    constructor(targetUnit, unitThatControlCanto) {
        this.targetUnit = targetUnit;
        this.unitThatControlCanto = unitThatControlCanto;
    }
}

class AtStartOfTurnEnv {
    /**
     * @param {BeginningOfTurnSkillHandler} handler
     * @param {Unit} targetUnit
     */
    constructor(handler, targetUnit) {
        this.handler = handler;
        this.targetUnit = targetUnit;
    }
}

class CalcMoveCountForCantoNode extends NumberNode {
    /**
     * @param {CantoEnv} env
     */
    evaluate(env) {
    }
}

class CantoRem extends CalcMoveCountForCantoNode {
    /** @type {number} */
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }

    /**
     * @returns {number}
     */
    evaluate(env) {
        return env.targetUnit.restMoveCount + this.#n;
    }
}

const CANTO_REM_PLUS_ONE_NODE = new CantoRem(1);

const IS_COMBAT_INITIATED_BY_UNIT = new class extends BoolNode {
    evaluate(env) {
        return env.targetUnit.battleContext.initiatesCombat;
    }
}();

class PercentageCondNode extends BoolNode {
    _percentage;

    constructor(percentage) {
        super();
        this._percentage = percentage;
    }

}

class IsHpGTENPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        return env.targetUnit.battleContext.restHpPercentage >= this._percentage;
    }
}

const IS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE = new IsHpGTENPercentAtStartOfCombatNode(25);

class IsFoesHpGTENPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        return env.enemyUnit.battleContext.restHpPercentage >= this._percentage;
    }
}

const IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE = new IsFoesHpGTENPercentAtStartOfCombatNode(75);

class ApplyNumericNode extends SkillEffectNode {
    /**
     * @param {number|NumberNode} numberOrNumberNode
     */
    constructor(numberOrNumberNode = null) {
        let value =
            typeof numberOrNumberNode === 'number' ? new ConstantNumberNode(numberOrNumberNode) : numberOrNumberNode;
        super(value);
    }

    evaluateChildren(env) {
        return super.evaluateChildren(env)[0];
    }
}

class GrantingBonusToAllNode extends FromPositiveNumberNode {
    evaluate(env) {
        env.targetUnit.addAllSpur(this.evaluateChildren(env));
    }
}

const GRANTING_BONUS_TO_ALL_5_NODE = new GrantingBonusToAllNode(5);

class GrantingBonusToAtk extends FromPositiveNumberNode {
    evaluate(env) {
        env.targetUnit.atkSpur += this.evaluateChildren(env);
    }
}

class GrantingBonusToAtkSpdNode extends FromPositiveNumbersNode {
    evaluate(env) {
        env.targetUnit.addAtkSpdSpurs(...this.evaluateChildren(env));
    }
}

const GRANTING_BONUS_TO_ATK_5_NODE = new GrantingBonusToAtkSpdNode(5);
const GRANTING_BONUS_TO_ATK_6_NODE = new GrantingBonusToAtkSpdNode(6);

class InflictingEachMinusNode extends FromPositiveNumbersNode {
    evaluate(env) {
        env.enemyUnit.addSpurs(...this.evaluateChildren(env).map(v => -v));
    }
}

class InPreCombatStatusNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        return env.targetUnit.getStatusesInPrecombat()[this.#index];
    }
}

const IN_PRE_COMBAT_ATK_NODE = new InPreCombatStatusNode(STATUS_INDEX.Atk);
const IN_PRE_COMBAT_SPD_NODE = new InPreCombatStatusNode(STATUS_INDEX.Spd);
const IN_PRE_COMBAT_DEF_NODE = new InPreCombatStatusNode(STATUS_INDEX.Def);
const IN_PRE_COMBAT_RES_NODE = new InPreCombatStatusNode(STATUS_INDEX.Res);

class InCombatStatusNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        return env.targetUnit.getStatusesInCombat(env.enemyUnit)[this.#index];
    }
}

const IN_COMBAT_ATK_NODE = new InCombatStatusNode(STATUS_INDEX.Atk);
const IN_COMBAT_SPD_NODE = new InCombatStatusNode(STATUS_INDEX.Spd);
const IN_COMBAT_DEF_NODE = new InCombatStatusNode(STATUS_INDEX.Def);
const IN_COMBAT_RES_NODE = new InCombatStatusNode(STATUS_INDEX.Res);

const MAKING_GUARANTEED_FOLLOW_UP_ATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.followupAttackPriorityIncrement++;
    }
}();

const FOE_CANNOT_MAKE_FOLLOW_UP_ATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.followupAttackPriorityDecrement--;
    }
}();

const NULL_FOLLOW_UP_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.setNullFollowupAttack();
    }
}();

const NULL_FOE_FOLLOW_UP_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.setNullFollowupAttack();
    }
}();

const UNIT_DISABLE_SKILLS_THAT_PREVENT_COUNTERATTACKS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.nullCounterDisrupt = true;
    }
}

const FOE_DISABLE_SKILLS_THAT_PREVENT_COUNTERATTACKS_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.nullCounterDisrupt = true;
    }
}

const UNIT_CANNOT_TRIGGER_ATTACKER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.preventedAttackerSpecial = true;
    }
}();

const FOE_CANNOT_TRIGGER_ATTACKER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.preventedAttackerSpecial = true;
    }
}();

const UNIT_CANNOT_TRIGGER_DEFENDER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.preventedDefenderSpecial = true;
    }
}();

const FOE_CANNOT_TRIGGER_DEFENDER_SPECIAL = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.preventedDefenderSpecial = true;
    }
}();

const UNIT_CAN_DISABLE_SKILLS_THAT_CHANGE_ATTACK_PRIORITY = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.canUnitDisableSkillsThatChangeAttackPriority = true;
    }
}();

const FOE_CAN_DISABLE_SKILLS_THAT_CHANGE_ATTACK_PRIORITY = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.canUnitDisableSkillsThatChangeAttackPriority = true;
    }
}();

class IncreasingSpdDiffNecessaryForFoesFollowUpNode extends FromNumberNode {
    evaluate(env) {
        env.enemyUnit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += this.evaluateChildren(env);
    }
}

class SetBoolToEachStatusNode extends SkillEffectNode {
    /** @type {[boolean, boolean, boolean, boolean]} */
    #values;

    /**
     * @param {boolean} atk
     * @param {boolean} spd
     * @param {boolean} def
     * @param {boolean} res
     */
    constructor(atk, spd, def, res) {
        super();
        this.#values = [atk, spd, def, res];
    }

    getValues() {
        return this.#values;
    }
}

class ApplyNumberToEachStatusNode extends SkillEffectNode {
    /** @type {[number, number, number, number]} */
    #values;

    /**
     * @param {number} atk
     * @param {number} spd
     * @param {number} def
     * @param {number} res
     */
    constructor(atk, spd, def, res) {
        super();
        this.#values = [atk, spd, def, res];
    }

    getValues() {
        return this.#values;
    }
}

class InvalidateOwnDebuffsNode extends SetBoolToEachStatusNode {
    evaluate(env) {
        env.targetUnit.battleContext.invalidateOwnDebuffs(...this.getValues());
    }
}

class InvalidateEnemyBuffsNode extends SetBoolToEachStatusNode {
    evaluate(env) {
        env.targetUnit.battleContext.invalidateBuffs(...this.getValues());
    }
}

class ApplyValueNode extends SkillEffectNode {
    #value;

    constructor(value) {
        super();
        this.#value = value;
    }

    getValue() {
        return this.#value;
    }
}

class ApplyValuesNode extends SkillEffectNode {
    #values = [];

    constructor(values) {
        super();
        values.forEach(v => this.#values.push(v));
    }

    getValues() {
        return this.#values;
    }
}

const NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE = new class extends NumberNode {
    evaluate(env) {
        return env.targetUnit.getPositiveStatusEffects().length + env.enemyUnit.getPositiveStatusEffects().length;
    }
}();

class DealingDamageNode extends ApplyNumericNode {
    evaluate(env) {
        env.targetUnit.battleContext.additionalDamage += this.evaluateChildren(env);
    }
}

class ReducingDamageNode extends ApplyNumericNode {
    evaluate(env) {
        env.targetUnit.battleContext.damageReductionValue += this.evaluateChildren(env);
    }
}

class ReducingDamageWhenFoesSpecialNode extends ApplyNumericNode {
    evaluate(env) {
        env.targetUnit.battleContext.damageReductionValueOfSpecialAttack += this.evaluateChildren(env);
    }
}

class ReducingDamageFromFirstAttackNode extends ApplyNumericNode {
    evaluate(env) {
        env.targetUnit.battleContext.damageReductionValueOfFirstAttacks += this.evaluateChildren(env);
    }
}

class RestoringHpAfterCombatNode extends ApplyNumericNode {
    evaluate(env) {
        env.targetUnit.battleContext.healedHpAfterCombat += this.evaluateChildren(env);
    }
}

const RESTORE_7_HP_AFTER_COMBAT_NODE = new RestoringHpAfterCombatNode(7);

class AddReductionRatiosOfDamageReductionRatioExceptSpecialNode extends FromNumberNode {
    evaluate(env) {
        env.targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(this.evaluateChildren(env));
    }
}

const ADD_REDUCTION_RATIOS_OF_DAMAGE_REDUCTION_RATIO_EXCEPT_SPECIAL_BY_50_PERCENT_NODE
    = new AddReductionRatiosOfDamageReductionRatioExceptSpecialNode(0.5);

const NEUTRALIZE_SPECIAL_COOLDOWN_CHARGE_MINUS = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.neutralizesReducesCooldownCount();
    }
}()

const UNIT_DISABLE_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
    }
}();

const FOE_DISABLE_SKILLS_OF_ALL_OTHERS_IN_COMBAT_EXCLUDING_UNIT_AND_FOE_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.enemyUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
    }
}();

class GrantingOrInflictingAfterStatusFixedNode extends SkillEffectNode {
    evaluate(env) {
        let node = new SkillEffectNode(...this.getChildren());
        env.targetUnit.battleContext.applySpurForUnitAfterCombatStatusFixedNodes.push(node);
    }
}

class ApplyingStatusEffectsAfterStatusFixedNode extends SkillEffectNode {
    evaluate(env) {
        let node = new SkillEffectNode(...this.getChildren());
        env.targetUnit.battleContext.applySkillEffectForUnitForUnitAfterCombatStatusFixedNodes.push(node);
    }
}

class IsGteStatusSumNode extends BoolNode {
    #unitAdd;
    #foeAdd;
    #ratios;

    /**
     * @param {number} unitAdd
     * @param {number} foeAdd
     * @param {[number, number, number, number]} ratios
     */
    constructor(unitAdd, foeAdd, ratios) {
        super();
        this.#unitAdd = unitAdd;
        this.#foeAdd = foeAdd;
        this.#ratios = ratios;
    }

    evaluate(env) {
        let unitStatuses = env.targetUnit.getStatusesInCombat(env.enemyUnit);
        let foeStatuses = env.enemyUnit.getStatusesInCombat(env.targetUnit);
        let diffs = ArrayUtil.sub(unitStatuses, foeStatuses);
        let total = ArrayUtil.mult(diffs, this.#ratios).reduce((prev, curr) => prev + curr);
        return total + this.#unitAdd - this.#foeAdd >= 0;
    }
}

// ターン開始時
class GrantStatusAtStartOfTurnNode extends ApplyNumberToEachStatusNode {
    evaluate(env) {
        env.targetUnit.reserveToApplyBuffs(...this.getValues());
    }
}

class GrantStatusEffectAtStartOfTurnNode extends ApplyValueNode {
    /**
     * @param {number} value
     */
    constructor(value) {
        super(value);
    }

    evaluate(env) {
        env.targetUnit.reserveToAddStatusEffect(this.getValue());
    }
}

class GrantStatusEffectsAtStartOfTurnNode extends ApplyValuesNode {
    /**
     * @param {number[]} values
     */
    constructor(values) {
        super(values);
    }

    evaluate(env) {
        this.getValues().forEach(v => env.targetUnit.reserveToAddStatusEffect(v));
    }
}

class CanInflictCantoControlWithinNSpacesNode extends BoolNode {
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }
    /**
     * @param {CantoControlEnv} env
     */
    evaluate(env) {
        return (env.targetUnit.distance(env.unitThatControlCanto) <= this.#n);
    }
}

const CAN_INFLICT_CANTO_CONTROL_WITHIN_4_SPACES_NODE = new CanInflictCantoControlWithinNSpacesNode(4);

class CanNeutralStatusEffectWithinNSpacesNode extends BoolNode {
    #statusEffect;
    #n;

    /**
     * @param {number} statusEffect
     * @param {number} n
     */
    constructor(statusEffect, n) {
        super();
        this.#statusEffect = statusEffect;
        this.#n = n;
    }

    /**
     * @param {AddStatusEffectEnv} env
     * @returns {boolean}
     */
    evaluate(env) {
        return env.statusEffect === this.#statusEffect &&
            env.targetUnit.distance(env.allyOrUnit) <= this.#n;
    }
}

const CAN_NEUTRAL_AFTER_START_OF_TURN_SKILLS_TRIGGER_ACTION_ENDS_IMMEDIATELY_WITHIN_3_SPACES_NODE =
    new CanNeutralStatusEffectWithinNSpacesNode(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately, 3);

class CanNeutralizeEndActionWithinNSpacesNode extends BoolNode {
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }

    /**
     * @param {NeutralizingEndActionEnv} env
     * @returns {boolean}
     */
    evaluate(env) {
        return env.targetUnit.distance(env.allyOrUnit) <= this.#n;
    }
}

const CAN_NEUTRALIZE_END_ACTION_WITHIN_3_SPACES_NODE = new CanNeutralizeEndActionWithinNSpacesNode(3);

// Hooks
/**
 * 戦闘時
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const APPLY_SKILL_EFFECT_FOR_UNIT_HOOKS = new SkillEffectHooks();

/**
 * 再移動条件
 * @type {SkillEffectHooks<BoolNode, BattleSimulatorBaseEnv>} */
const CAN_ACTIVATE_CANTO_HOOKS = new SkillEffectHooks();

/**
 * 再移動量
 * @type {SkillEffectHooks<NumberNode, CantoEnv>} */
const CALC_MOVE_COUNT_FOR_CANTO_HOOKS = new SkillEffectHooks();

/**
 * ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_TURN_HOOKS = new SkillEffectHooks();

/**
 * 戦闘前
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const BEFORE_PRECOMBAT_HOOKS = new SkillEffectHooks();

/**
 * 再移動制限評価時
 * @type {SkillEffectHooks<BoolNode, CantoControlEnv>} */
const CAN_INFLICT_CANTO_CONTROL_HOOKS = new SkillEffectHooks();

/**
 * ステータス付与時
 * @type {SkillEffectHooks<BoolNode, AddStatusEffectEnv>} */
const CAN_NEUTRALIZE_STATUS_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * スキルによる行動停止無効
 * @type {SkillEffectHooks<BoolNode, NeutralizingEndActionEnv>} */
const CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * ステータスによる行動停止無効
 * @type {SkillEffectHooks<BoolNode, NeutralizingEndActionEnv>} */
const CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS = new SkillEffectHooks();