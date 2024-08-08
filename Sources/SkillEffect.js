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
        return this.evaluateChild(...arguments);
    }

    evaluateChild() {
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
class CondNode extends SkillEffectNode {
    /**
     * @abstract
     * @returns {boolean} */
    evaluate(env) {
    }
}

class AndNode extends CondNode {
    evaluate(env) {
        return this.getChildren().every(child => child.evaluate(env));
    }
}

class OrNode extends CondNode {
    evaluate(env) {
        return this.getChildren().some(child => child.evaluate(env));
    }
}

class BoolNode extends CondNode {
    /**
     * @param {boolean|CondNode} value
     */
    constructor(value) {
        if (typeof value === 'boolean') {
            super(value ? TRUE_NODE : FALSE_NODE);
        } else {
            super(value);
        }
    }

    evaluate(env) {
        return this._children[0].evaluate(env);
    }
}

class TrueNode extends CondNode {
    evaluate() {
        return true;
    }
}

const TRUE_NODE = new TrueNode();

class FalseNode extends CondNode {
    evaluate(env) {
        return false;
    }
}

const FALSE_NODE = new FalseNode();

/**
 * @template T1
 * @template T2
 */
class PairNode extends SkillEffectNode {
    getFirst() {
        return this.getChildren()[0];
    }
}

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

class MultNode extends NumberOperationNode {
    setValue(value) {
        this.getValueNode().setValue(value);
    }

    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        return super.evaluateChild(env).reduce((a, b) => a * b);
    }
}

class MultTruncNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        return super.evaluateChild(env).reduce((a, b) => Math.trunc(a * b));
    }
}

class IfNode extends SkillEffectNode {
    /** @type {CondNode} */
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

class DamageCalculatorWrapperEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {boolean} calcPotentialDamage
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

class CantoEnv {
    /**
     * @param {Unit} targetUnit
     * @param {number} moveCountForCanto
     */
    constructor(targetUnit, moveCountForCanto) {
        this.targetUnit = targetUnit;
        this.moveCountForCanto = moveCountForCanto;
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

/**
 * @template {SkillEffectNode} C
 * @extends {SkillEffectNode<C>}
 */
class ApplySkillEffectForUnitNode extends SkillEffectNode {
    /**
     * @param {DamageCalculatorWrapperEnv} env
     */
    evaluate(env) {
        return super.evaluate(env);
    }
}

class CanActivateCantoNode extends SkillEffectNode {
    /**
     * @param {BattleSimulatorBaseEnv} env
     */
    evaluate(env) {
        return super.evaluate(env);
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

class InitiateCombatNode extends CondNode {
    evaluate(env) {
        return env.targetUnit.battleContext.initiatesCombat;
    }
}

const INITIATE_COMBAT_NODE = new InitiateCombatNode();

class PercentageCondNode extends CondNode {
    _percentage;

    constructor(percentage) {
        super();
        this._percentage = percentage;
    }

}

class IsRestHpPercentageHigherOrEqualNode extends PercentageCondNode {
    evaluate(env) {
        return env.targetUnit.battleContext.restHpPercentage >= this._percentage;
    }
}

const IS_REST_HP_PERCENTAGE_HIGHER_OR_EQUAL_25_NODE = new IsRestHpPercentageHigherOrEqualNode(25);

class IsEnemyRestHpPercentageHigherOrEqualNode extends PercentageCondNode {
    evaluate(env) {
        return env.enemyUnit.battleContext.restHpPercentage >= this._percentage;
    }
}

const IS_ENEMY_REST_HP_PERCENTAGE_HIGHER_OR_EQUAL_75_NODE = new IsEnemyRestHpPercentageHigherOrEqualNode(75);

/**
 * @template {NumberNode} C
 * @extends {SkillEffectNode<NumberNode>}
 */
class ApplyNumericNode extends SkillEffectNode {
    constructor(numberOrNumberNode = null) {
        let value =
            typeof numberOrNumberNode === 'number' ? new ConstantNumberNode(numberOrNumberNode) : numberOrNumberNode;
        super(value);
    }

    /**
     * @param {number} value
     */
    setValue(value) {
        this._children = [new ConstantNumberNode(value)];
    }

    getValueNode() {
        return this._children[0];
    }

    evaluateChild(env) {
        return super.evaluateChild(env)[0];
    }
}

/**
 * @abstract
 */
class TransNumericNode extends ApplyNumericNode {
    /**
     * @param {NumberOperationNode} numOpNode
     * @param {ApplyNumericNode} node
     */
    constructor(numOpNode, node) {
        super(node);
        this._numOpNode = numOpNode;
    }

    /**
     * @abstract
     */
    evaluate(env) {
        // 演算を行う
        // return this.evaluateChild(env);
    }
}

class MultValueNode extends TransNumericNode {

}

class ApplyCommonNumericNode extends SkillEffectNode {
    /**
     * @param {NumberNode} numNode
     * @param {...[ApplyNumericNode, NumberOperationNode]} nodes
     */
    constructor(numNode, ...nodes) {
        super(...nodes);
        this._numNode = numNode;
    }

    evaluate(env) {
        let value = this._numNode.evaluate(env);
        return this._children.map(node => {
            node.setValue(value);
            return node.evaluate(env);
        });
    }
}

class MultValue extends ApplyNumericNode {
    /**
     * @param {number} n
     * @param {ApplyNumericNode} node
     */
    constructor(n, node) {
        super();
        this._n = n;
        this._node = node;
    }

    setValue(value) {
        this._node.setValue(value);
    }

    evaluate(env) {
        this._node.setValue(this.evaluateChild(env));
        // TODO: returnをどうするか考える
        this._node.evaluate(env);
    }
}

/**
 * @template {NumberNode} C
 * @extends {SkillEffectNode<NumberNode>}
 */
class GrantBonusNode extends SkillEffectNode {
    constructor(...values) {
        super();
        values.forEach(value => {
                if (typeof value === 'number') {
                    this.addChild(new ConstantNumberNode(value));
                } else {
                    this.addChild(value);
                }
            }
        );
    }
}

class GrantBonusToAllNode extends GrantBonusNode {
    evaluate(env) {
        env.targetUnit.addAllSpur(...super.evaluate(env));
    }
}

class GrantBonusToAtk extends GrantBonusNode {
    evaluate(env) {
        env.targetUnit.atkSpur += super.evaluate(env)[0];
    }
}

class GrantBonusToAtkSpdNode extends GrantBonusNode {
    evaluate(env) {
        env.targetUnit.addAtkSpdSpurs(...super.evaluate(env));
    }
}

const GRANT_BONUS_TO_ATK_5_NODE = new GrantBonusToAtkSpdNode(5);
const GRANT_BONUS_TO_ATK_6_NODE = new GrantBonusToAtkSpdNode(6);

class PrecombatStatusNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        return env.targetUnit.getStatusesInPrecombat()[this.#index];
    }
}

const PRECOMBAT_ATK_NODE = new PrecombatStatusNode(STATUS_INDEX.Atk);
const PRECOMBAT_SPD_NODE = new PrecombatStatusNode(STATUS_INDEX.Spd);
const PRECOMBAT_DEF_NODE = new PrecombatStatusNode(STATUS_INDEX.Def);
const PRECOMBAT_RES_NODE = new PrecombatStatusNode(STATUS_INDEX.Res);

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

class ValueNode extends SkillEffectNode {
    constructor(value) {
        if (typeof value === 'number') {
            super(new ConstantNumberNode(value));
        } else if (typeof value === 'boolean') {
            super(new BoolNode(value));
        } else {
            super(value);
        }
    }

    evaluate() {
        return super.evaluate()[0];
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

class DealDamageNode extends ApplyNumericNode {
    evaluate(env) {
        env.targetUnit.battleContext.additionalDamage += this.evaluateChild(env);
    }
}

class AddReductionRatiosOfDamageReductionRatioExceptSpecialNode extends ValueNode {
    evaluate(env) {
        env.targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(super.evaluate(env));
    }
}

const ADD_REDUCTION_RATIOS_OF_DAMAGE_REDUCTION_RATIO_EXCEPT_SPECIAL_BY_50_PERCENT_NODE
    = new AddReductionRatiosOfDamageReductionRatioExceptSpecialNode(0.5);

class NeutralizeSpecialCooldownChargeMinus extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.neutralizesReducesCooldownCount();
    }
}

const NEUTRALIZE_SPECIAL_COOLDOWN_CHARGE_MINUS = new NeutralizeSpecialCooldownChargeMinus()

class DisablesSkillsFromEnemyAlliesInCombatNode extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.disablesSkillsFromEnemyAlliesInCombat = true;
    }
}

const DISABLES_SKILLS_FROM_ENEMY_ALLIES_IN_COMBAT_NODE = new DisablesSkillsFromEnemyAlliesInCombatNode();

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

// TODO: rename(to upper case)
/**
 * 戦闘時
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const applySkillEffectForUnitHooks = new SkillEffectHooks();

/**
 * 再移動条件
 * @type {SkillEffectHooks<SkillEffectNode, BattleSimulatorBaseEnv>} */
const canActivateCantoHooks = new SkillEffectHooks();

/**
 * 再移動量
 * @type {SkillEffectHooks<SkillEffectNode, CantoEnv>} */
const calcMoveCountForCantoHooks = new SkillEffectHooks();

/**
 * ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const atStartOfTurnHooks = new SkillEffectHooks();