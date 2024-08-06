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
class SkillEffectMap {
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
}

/**
 * @template {SkillEffectNode} C
 */
class SkillEffectNode {
    /** @type {SkillEffectNode} */
    _parent = null;
    /** @type {C[]} */
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
        return this._children.map(child => child.evaluate(...arguments));
    }

    addParent(node) {
        this._parent = node;
    }

    /**
     * @param {C} node
     */
    addChild(node) {
        this._children.push(node);
        // noinspection JSUnresolvedReference
        node.addParent(this);
    }

    /**
     * @param {C} children
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

class NumberNode extends SkillEffectNode {
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

class CondNode extends SkillEffectNode {
    /** @returns {boolean} */
    evaluate(env) {
        return super.evaluate(env)[0];
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
}

class TrueNode extends CondNode {
    evaluate() {
        return true;
    }
}

TRUE_NODE = new TrueNode();

class FalseNode extends CondNode {
    evaluate() {
        return false;
    }
}

FALSE_NODE = new FalseNode();

class NumberOperationNode extends SkillEffectNode {
    constructor(...values) {
        super();
        values.forEach(value => {
                let v = typeof value === 'number' ? new NumberNode(value) : value;
                this.addChild(v);
            }
        );
    }
}

class MultNode extends NumberOperationNode {
    evaluate(env) {
        return super.evaluate(env).reduce((a, b) => a * b);
    }
}

class MultTruncNode extends NumberOperationNode {
    evaluate(env) {
        return super.evaluate(env).reduce((a, b) => Math.trunc(a * b));
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
// TODO: rename
class AddSpursNode extends SkillEffectNode {
    constructor(...values) {
        super();
        values.forEach(value => {
                if (typeof value === 'number') {
                    this.addChild(new NumberNode(value));
                } else {
                    this.addChild(value);
                }
            }
        );
    }
}

class AddAllSpurNode extends AddSpursNode {
    evaluate(env) {
        env.targetUnit.addAllSpur(...super.evaluate(env));
    }
}

class AddAtkSpurNode extends AddSpursNode {
    evaluate(env) {
        env.targetUnit.atkSpur += super.evaluate(env)[0];
    }
}

class AddAtkSpdSpurNode extends AddSpursNode {
    evaluate(env) {
        env.targetUnit.addAtkSpdSpurs(...super.evaluate(env));
    }
}

const ADD_ATK_SPD_SPUR_5_NODE = new AddAtkSpdSpurNode(5);
const ADD_ATK_SPD_SPUR_6_NODE = new AddAtkSpdSpurNode(6);

class PrecombatStatusNode extends SkillEffectNode {
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
    /** @type {boolean[]} */
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
            super(new NumberNode(value));
        } else if (typeof value === 'boolean') {
            super(new BoolNode(value));
        } else {
            super();
        }
    }
}

class AddReductionRatiosOfDamageReductionRatioExceptSpecialNode extends ValueNode {
    evaluate(env) {
        env.targetUnit.battleContext.reductionRatiosOfDamageReductionRatioExceptSpecial.push(super.evaluate(env));
    }
}

const ADD_REDUCTION_RATIOS_OF_DAMAGE_REDUCTION_RATIO_EXCEPT_SPECIAL_BY_50_PERCENT_NODE = new AddReductionRatiosOfDamageReductionRatioExceptSpecialNode(0.5);

class NeutralizesReducesCooldownCountNode extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.neutralizesReducesCooldownCount();
    }
}

const NEUTRALIZES_REDUCES_COOLDOWN_COUNT_NODE = new NeutralizesReducesCooldownCountNode()

/** @type {SkillEffectMap<ApplySkillEffectForUnitNode, DamageCalculatorWrapperEnv>} */
const applySkillEffectForUnitMap = new SkillEffectMap();
