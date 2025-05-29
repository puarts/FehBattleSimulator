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
 * @template {NodeEnv} E
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
     * @param {(number|string)[]} skillIds
     * @param {() => N} nodeFunc
     */
    addSkills(skillIds, nodeFunc) {
        skillIds.forEach(skillId => this.addSkill(skillId, nodeFunc));
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
        let skills = this.getSkills(skillId);
        if (skills.length > 0) {
            this.#skillNameLog(skillId, env);
            if (skills.length >= 2) {
                env?.info(`登録スキル数: ${skills.length}`);
            }
        }
        return skills.map(skillNode => skillNode.evaluate(env));
    }

    #skillNameLog(skillId, env) {
        const str = `${skillId}`;
        const underscoreIndex = str.indexOf("_");

        // プレフィックスとサフィックスをそれぞれ抽出
        const prefix = str.substring(0, underscoreIndex);
        const suffix = str.substring(underscoreIndex + 1);
        let type = '';
        switch (prefix) {
            case 'n':
                break;
            case 'r':
                type = '錬成'
                break;
            case 'sr':
                type = '特殊錬成'
                break;
            case 'e':
                type = '紋章士'
                break;
            case 'se':
                type = 'ステータス効果'
                break;
            case 'style':
                type = 'スタイル効果'
                break;
            case 'duo-or-harmonized':
                type = '比翼・双界スキル'
                break;
        }
        let name;
        if (prefix === 'e') {
            name = ObjectUtil.getKeyName(EmblemHero, Number(suffix));
        } else if (prefix === 'se') {
            name = getStatusEffectName(suffix);
        } else if (prefix === 'style') {
            name = ObjectUtil.getKeyName(STYLE_TYPE, Number(suffix));
        } else if (prefix === 'duo-or-harmonized') {
            name = `（${ObjectUtil.getKeyName(Hero, Number(suffix))}）`;
        } else {
            name = g_appData.skillDatabase?.findSkillInfoByDict(suffix)?.name ?? `${skillId}`;
        }
        env?.info(`${env.skillOwner.nameWithGroup}の${type}${name}を評価`);
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {*[]}
     */
    evaluateWithUnit(unit, env) {
        // TODO: 付与されたステータスも入れるようにする
        // 1つのskillIdに複数の効果が入るのでflatで平らにする
        return Array.from(unit.enumerateSkills()).map(skillId => this.evaluate(skillId, env)).flat();
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {boolean}
     */
    evaluateSomeWithUnit(unit, env) {
        return this.evaluateWithUnit(unit, env).some(v => v);
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {number}
     */
    evaluateMaxWithUnit(unit, env) {
        return Math.max(...this.evaluateWithUnit(unit, env));
    }

    evaluateSumWithUnit(unit, env) {
        return ArrayUtil.sum(this.evaluateWithUnit(unit, env)) ?? 0;
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {[number, number, number, number]}
     */
    evaluateStatsSumWithUnit(unit, env) {
        return this.evaluateWithUnit(unit, env).reduce((a, b) => ArrayUtil.add(a, b), [0, 0, 0, 0]);
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     */
    evaluateConcatWithUnit(unit, env) {
        return IterUtil.concat(...this.evaluateWithUnit(unit, env));
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     */
    evaluateConcatUniqueWithUnit(unit, env) {
        return IterUtil.unique(...this.evaluateWithUnit(unit, env));
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

    // noinspection JSUnusedGlobalSymbols
    setSkill(skillId, skillName) {
        this._skillId = skillId;
        this._skillName = skillName;
    }

    /**
     * @param {NodeEnv} env
     */
    evaluate(env) {
        return this.evaluateChildren(env);
    }

    evaluateChildren(env) {
        return this._children.map(child => child.evaluate(env));
    }

    addParent(node) {
        this._parent = node;
    }

    // noinspection JSUnusedGlobalSymbols
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
            child.addParent(this);
        }
    }

    getChildren() {
        return this._children;
    }

    toString() {
        return `SkillEffectNode(${this._children.length})`;
    }
}

const SKILL_EFFECT_NODE = (...nodes) => new SkillEffectNode(...nodes);

/**
 * @abstract
 */
class NumberNode extends SkillEffectNode {
    /**
     * @param {number|NumberNode} numberOrNode
     * @returns {ConstantNumberNode|NumberNode}
     */
    static makeNumberNodeFrom(numberOrNode) {
        return typeof numberOrNode === 'number' ? new ConstantNumberNode(numberOrNode) : numberOrNode;
    }

    /**
     * @abstract
     * @param {NodeEnv} env
     * @returns {number}
     */
    evaluate(env) {
        return super.evaluate(env);
    }
}

/**
 * @abstract
 */
class NumbersNode extends SkillEffectNode {
    /**
     * @abstract
     * @param {NodeEnv} env
     * @returns {number[]}
     */
    evaluate(env) {
    }
}

class TopNNode extends NumbersNode {
    /**
     * @param {number|NumberNode} n
     * @param {NumbersNode} numbersNode
     */
    constructor(n, numbersNode) {
        super();
        this._n = NumberNode.makeNumberNodeFrom(n);
        this._numbersNode = numbersNode;
    }

    evaluate(env) {
        let n = this._n.evaluate(env);
        let ns = this._numbersNode.evaluate(env);
        let sorted = ns.sort((a, b) => b - a);
        return sorted.slice(0, n);
    }
}

/**
 * @param {number|NumberNode} n
 * @param {NumbersNode} numbersNode
 * @constructor
 */
const TOP_N_NODE = (n, numbersNode) => new TopNNode(n, numbersNode);

class SumNumbersNode extends NumberNode {
    /**
     * @param {NumbersNode} numbersNode
     */
    constructor(numbersNode) {
        super();
        this._numbersNode = numbersNode;
    }

    evaluate(env) {
        let ns = this._numbersNode.evaluate(env);
        return ArrayUtil.sum(ns);
    }
}

/**
 * @param {NumbersNode} ns
 * @returns {SumNumbersNode}
 * @constructor
 */
const SUM_NUMBERS_NODE = (ns) => new SumNumbersNode(ns);

class PositiveNumberNode extends NumberNode {
    evaluate(env) {
        let number = super.evaluate(env);
        if (number < 0) {
            env.error(`Not a positive number: ${number}`);
        }
        return number;
    }
}

class IntPercentageNumberNode extends NumberNode {
    constructor(n) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }
    evaluate(env) {
        let n = this._nNode.evaluate(env);
        if (!Number.isInteger(n)) {
            env.error(`Not a integer: ${n}`);
        }
        return n;
    }
}

const INT_PERCENTAGE_NUMBER_NODE = n => new IntPercentageNumberNode(n);

/**
 * @abstract
 */
class FromNumberNode extends SkillEffectNode {
    /**
     * @param {number|NumberNode} numberOrNode
     */
    constructor(numberOrNode) {
        super(NumberNode.makeNumberNodeFrom(numberOrNode));
    }

    /**
     * @returns {number}
     */
    evaluateChildren(env) {
        return super.evaluateChildren(env)[0];
    }

    /**
     * @abstract
     * @param {NodeEnv} env
     */
    evaluate(env) {
    }
}

/**
 * @abstract
 */
class FromNumbersNode extends SkillEffectNode {
    /**
     * @param {...number|NumberNode|NumbersNode} values
     */
    constructor(...values) {
        let isNumbersNode = values[0] && values[0] instanceof NumbersNode;
        if (!isNumbersNode) {
            super(...values.map(v => NumberNode.makeNumberNodeFrom(v)));
        } else {
            super();
            /** @type {NumbersNode} */
            this._numbesNode = values[0];
        }
    }

    /**
     * @param env
     * @returns {number[]}
     */
    evaluateChildren(env) {
        if (this._numbesNode) {
            return this._numbesNode.evaluate(env);
        }
        return super.evaluateChildren(env);
    }

    /**
     * @param {NodeEnv} env
     * @abstract
     */
    evaluate(env) {
        if (this._numbesNode) {
            return this._numbesNode.evaluateChildren(env);
        }
        return super.evaluateChildren(env);
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

// TODO: マイナスが許されない場所でこのクラスを使用するようにする
class FromNumberEnsuredNonNegativeNode extends FromNumberNode {
    evaluateChildren(env) {
        let value = super.evaluateChildren(env);
        if (value < 0) {
            env.warn(`Negative value detected, adjust to 0. value: ${value}`);
        }
        return MathUtil.ensureMin(value, 0);
    }
}

class FromPositiveNumbersNode extends FromNumbersNode {
    evaluateChildren(env) {
        let evaluatedValues = super.evaluateChildren(env);
        if (evaluatedValues.some(value => value < 0)) {
            env.error(`Negative value is not allowed. values: ${evaluatedValues}`);
        }
        return evaluatedValues;
    }
}

class ConstantNumberNode extends NumberNode {
    /** @type {number} */
    #value;

    /**
     * @param {number} value
     */
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

const CONSTANT_NUMBER_NODE = value => new ConstantNumberNode(value);

/**
 * @template T
 * @abstract
 */
class SetNode extends SkillEffectNode {
    /**
     * @param env
     * @returns {Set<T>}
     * @abstract
     */
    evaluate(env) {
    }
}

/**
 * @template T
 */
class UnionSetNode extends SetNode {
    /**
     * @param {...SetNode<T>} nodes
     */
    constructor(...nodes) {
        let a = nodes;
        super(...nodes);
    }

    /**
     * @param env
     * @returns {Set<T>}
     */
    evaluate(env) {
        let sets = this.evaluateChildren(env);
        return SetUtil.union(...sets);
    }
}

const UNION_SET_NODE = (...nodes) => new UnionSetNode(...nodes);

class SetSizeNode extends PositiveNumberNode {
    /**
     * @param {SetNode} setNode
     */
    constructor(setNode) {
        super();
        this._setNode = setNode;
    }

    evaluate(env) {
        return this._setNode.evaluate(env).size;
    }
}

const SET_SIZE_NODE = setNode => new SetSizeNode(setNode);

/**
 * @abstract
 */
class BoolNode extends SkillEffectNode {
    /**
     * @param {boolean|BoolNode} boolOrNode
     * @returns {BoolNode}
     */
    static makeBoolNodeFrom(boolOrNode) {
        if (typeof boolOrNode === 'boolean') {
            return boolOrNode ? TRUE_NODE : FALSE_NODE;
        } else {
            return boolOrNode;
        }
    }

    /**
     * @abstract
     * @param {NodeEnv} env
     * @returns {boolean} */
    evaluate(env) {
        super.evaluate(env);
    }
}

class AndNode extends BoolNode {
    evaluate(env) {
        let result = this.getChildren().every(child => child.evaluate(env));
        env?.trace(`[AndNode] ${result}`);
        return result;
    }
}

// noinspection JSUnusedGlobalSymbols
const AND_NODE = (...nodes) => new AndNode(...nodes);

class OrNode extends BoolNode {
    evaluate(env) {
        let result = this.getChildren().some(child => child.evaluate(env));
        env?.trace(`[OrNode] ${result}`);
        return result;
    }
}

// noinspection JSUnusedGlobalSymbols
const OR_NODE = (...nodes) => new OrNode(...nodes);

class NotNode extends BoolNode {
    /**
     * @param {boolean|BoolNode} value
     */
    constructor(value) {
        super();
        this._boolNode = BoolNode.makeBoolNodeFrom(value);
    }

    evaluate(env) {
        let result = !this._boolNode.evaluate(env);
        env.trace(`[NotNode] ${result}`);
        return result;
    }
}

// noinspection JSUnusedGlobalSymbols
const NOT_NODE = node => new NotNode(node);

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

class TraceBoolNode extends BoolNode {
    /**
     * @param {boolean|BoolNode} b
     */
    constructor(b) {
        super();
        this._boolNode = BoolNode.makeBoolNodeFrom(b);
    }

    evaluate(env) {
        let result = this._boolNode.evaluate(env);
        env.trace(`value: ${result}`);
        return result;
    }
}

/**
 * @abstract
 */
class NumberOperationNode extends NumberNode {
    /**
     * @param {...(number|NumberNode)|(number|NumberNode)[]} values
     */
    constructor(...values) {
        let numbers;
        if (Array.isArray(values[0])) {
            // 配列が渡された場合
            numbers = values[0];
        } else {
            // 可変長引数の場合
            numbers = values;
        }
        super(...numbers.map(v => NumberNode.makeNumberNodeFrom(v)));
    }

    /**
     * @param env
     * @returns {number[]}
     */
    evaluateChildren(env) {
        let evaluations = this._children.map(child => child.evaluate(env));
        if (Array.isArray(evaluations[0]) && evaluations.length === 1) {
            return evaluations[0];
        }
        evaluations.forEach(evaluation => {
            if (typeof evaluation !== 'number') {
                env?.error(`Expected a number but received: ${JSON.stringify(evaluation)}. Type: ${evaluation.constructor.name}.`);
            }
        })
        return evaluations;
    }
}

class EnsureMinNode extends NumberOperationNode {
    #minNode;

    /**
     * @param {number|NumberNode} child
     * @param {number|NumberNode} min
     */
    constructor(child, min) {
        super(child);
        this.#minNode = NumberNode.makeNumberNodeFrom(min);
    }

    evaluateChildren(env) {
        return super.evaluateChildren(env)[0];
    }

    evaluate(env) {
        let value = this.evaluateChildren(env);
        let min = this.#minNode.evaluate(env);
        let result = MathUtil.ensureMin(value, min);
        env?.trace(`[EnsureMinNode] (value: ${value}, min: ${min}) => ${result}`);
        return result;
    }
}

const ENSURE_MIN_NODE = (child, min) => new EnsureMinNode(child, min);

class EnsureMaxNode extends NumberOperationNode {
    #maxNode;

    /**
     * @param {number|NumberNode} child
     * @param {number|NumberNode} max
     */
    constructor(child, max) {
        super(child);
        this.#maxNode = NumberNode.makeNumberNodeFrom(max);
    }

    evaluateChildren(env) {
        return super.evaluateChildren(env)[0];
    }

    evaluate(env) {
        let value = this.evaluateChildren(env);
        let max = this.#maxNode.evaluate(env);
        let result = MathUtil.ensureMax(value, max);
        env?.trace(`[EnsureMaxNode] (value: ${value}, max: ${max}) => ${result}`);
        return result;
    }
}

const ENSURE_MAX_NODE = (child, max) => new EnsureMaxNode(child, max);

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
        let value = this.evaluateChildren(env);
        let result = MathUtil.ensureMinMax(value, this.#min, this.#max);
        env?.trace(`[EnsureMinMaxNode] (min: ${this.#min}, value: ${value}, max: ${this.#max}) => ${result}`);
        return result;
    }
}

const ENSURE_MIN_MAX_NODE = (child, min, max) => new EnsureMinMaxNode(child, min, max);
const ENSURE_MAX_MIN_NODE = (child, max, min) => ENSURE_MIN_MAX_NODE(child, min, max);

class AddNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = evaluated.reduce((a, b) => a + b);
        env?.trace(`[AddNode] add [${[evaluated]}] = ${result}`);
        return result;
    }
}

const ADD_NODE = (...node) => new AddNode(...node);

class SubNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = evaluated.reduce((a, b) => a - b);
        env?.trace(`[SubNode] sub [${[evaluated]}] = ${result}`);
        return result;
    }
}

const SUB_NODE = (...node) => new SubNode(...node);

class MultNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = evaluated.reduce((a, b) => a * b);
        env?.trace(`[MultNode] mult [${[evaluated]}] = ${result}`);
        return result;
    }
}

const MULT_NODE = (...node) => new MultNode(...node);

class MultTruncNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = evaluated.reduce((a, b) => Math.trunc(a * b));
        env?.trace(`[MultTruncNode] mult trunc [${[evaluated]}] = ${result}`);
        return result;
    }
}

const MULT_TRUNC_NODE = (...node) => new MultTruncNode(...node);

class MultCeilNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = evaluated.reduce((a, b) => Math.ceil(a * b));
        env?.trace(`[MultCeilNode] mult ceil [${[evaluated]}] = ${result}`);
        return result;
    }
}

const MULT_CEIL_NODE = (...node) => new MultCeilNode(...node);

const MULT_ADD_NODE = (mult1, mult2, add) => ADD_NODE(MULT_NODE(mult1, mult2), add);
const MULT_MAX_NODE = (mult1, mult2, max) => ENSURE_MAX_NODE(MULT_NODE(mult1, mult2), max);
const MULT_ADD_MAX_NODE = (mult1, mult2, add, max) =>
    ENSURE_MAX_NODE(ADD_NODE(MULT_NODE(mult1, mult2), add), max);
const ADD_MAX_NODE = (add1, add2, max) => ENSURE_MAX_NODE(ADD_NODE(add1, add2), max);

class MinNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = Math.min(...evaluated);
        env?.trace(`[MinNode] min [${[evaluated]}] = ${result}`);
        return result;
    }
}

const MIN_NODE = (...node) => new MinNode(...node);

class MaxNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = Math.max(...evaluated);
        env?.trace(`[MaxNode] max [${[evaluated]}] = ${result}`);
        return result;
    }
}

const MAX_NODE = (...node) => new MaxNode(...node);

class SumNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = evaluated.reduce((a, b) => a + b, 0);
        env?.trace(`[SumNode] max [${[evaluated]}] = ${result}`);
        return result;
    }
}

const SUM_NODE = (...node) => new SumNode(...node);

/**
 * @abstract
 */
class CompareNode extends BoolNode {
    /**
     * @param {number|NumberNode} left
     * @param {number|NumberNode} right
     */
    constructor(left, right) {
        super(NumberNode.makeNumberNodeFrom(left), NumberNode.makeNumberNodeFrom(right));
    }
}

class GtNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        let result = left > right;
        env?.trace(`[GtNode] ${left} > ${right}: ${result}`);
        return result;
    }
}

const GT_NODE = (a, b) => new GtNode(a, b);

class GteNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left >= right;
    }
}

const GTE_NODE = (a, b) => new GteNode(a, b);

// noinspection JSUnusedGlobalSymbols
class LtNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left < right;
    }
}

const LT_NODE = (a, b) => new LtNode(a, b);

class LteNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left <= right;
    }
}

const LTE_NODE = (...node) => new LteNode(...node);

// noinspection JSUnusedGlobalSymbols
class EqNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        let result = left === right;
        env.trace(`[EqNode] ${left} === ${right}: ${result}`);
        return result;
    }
}

const EQ_NODE = (...node) => new EqNode(...node);

class IfNode extends SkillEffectNode {
    /** @type {BoolNode} */
    #condNode;

    /**
     * @param {BoolNode} condNode
     * @param {...SkillEffectNode} stmtNodes
     */
    constructor(condNode, ...stmtNodes) {
        super(...stmtNodes);
        this.#condNode = condNode;
    }

    evaluate(env) {
        env?.trace("[IfNode] 条件を評価");
        if (this.#condNode.evaluate(env)) {
            env?.trace("[IfNode] 条件は真");
            return super.evaluate(env);
        }
        env?.trace("[IfNode] 条件は偽");
    }
}

/**
 * @param {BoolNode} condNode
 * @param {...SkillEffectNode} stmtNodes
 * @returns {IfNode}
 * @constructor
 */
const IF_NODE = (condNode, ...stmtNodes) => new IfNode(condNode, ...stmtNodes);

const UNLESS_NODE = (condNode, ...stmtNodes) => IF_NODE(NOT_NODE(condNode), ...stmtNodes);

class IfElseNode extends SkillEffectNode {
    /** @type {BoolNode} */
    #condNode;

    /**
     * @param {BoolNode} condNode
     * @param {number|NumberNode} trueNode
     * @param {number|NumberNode} falseNode
     */
    constructor(condNode, trueNode, falseNode) {
        super(NumberNode.makeNumberNodeFrom(trueNode), NumberNode.makeNumberNodeFrom(falseNode));
        this.#condNode = condNode;
    }

    getChildren() {
        return super.getChildren();
    }

    evaluate(env) {
        let condResult = this.#condNode.evaluate(env);
        let index = condResult ? 0 : 1;
        env?.trace(`[IfThenElseNode] 条件を評価: ${condResult}`)
        let evalNode = condResult ? 'IF' : 'ELSE';
        env?.trace(`[IfThenElseNode] ${evalNode}を評価`);
        return this.getChildren()[index].evaluate(env);
    }
}

const IF_ELSE_NODE = (condNode, trueNode, falseNode) => new IfElseNode(condNode, trueNode, falseNode);

class IfExpressionNode extends SkillEffectNode {
    /**
     * @param {boolean|BoolNode} condNode
     * @param trueNode
     * @param falseNode
     */
    constructor(condNode, trueNode, falseNode) {
        super();
        this._condNode = BoolNode.makeBoolNodeFrom(condNode);
        this._trueNode = trueNode;
        this._falseNode = falseNode;
    }

    evaluate(env) {
        let condResult = this._condNode.evaluate(env);
        return condResult ? this._trueNode.evaluate(env) : this._falseNode.evaluate(env);
    }
}

/**
 * @param {boolean|BoolNode} condNode
 * @param trueNode
 * @param falseNode
 * @constructor
 */
const IF_EXPRESSION_NODE = (condNode, trueNode, falseNode) =>
    new IfExpressionNode(condNode, trueNode, falseNode);

class TernaryConditionalNumberNode extends NumberNode {
    /** @type {BoolNode} */
    #condNode;

    /**
     * @param {BoolNode} condNode
     * @param {number|NumberNode} trueNode
     * @param {number|NumberNode} falseNode
     */
    constructor(condNode, trueNode, falseNode) {
        super(NumberNode.makeNumberNodeFrom(trueNode), NumberNode.makeNumberNodeFrom(falseNode));
        this.#condNode = condNode;
    }

    /**
     * @returns {NumberNode[]}
     */
    getChildren() {
        return super.getChildren();
    }

    evaluate(env) {
        let condResult = this.#condNode.evaluate(env);
        let index = condResult ? 0 : 1;
        env?.trace(`[TernaryConditionalNumberNode] 条件を評価: ${condResult}`)
        let result = this.getChildren()[index].evaluate(env);
        env?.trace(`[TernaryConditionalNumberNode] 式を評価: ${result}`)
        return result;
    }
}

const COND_OP =
    (cond, trueNode, falseNode) => new TernaryConditionalNumberNode(cond, trueNode, falseNode);
const IF_VALUE_NODE = COND_OP;

class StoreNumNode extends FromNumberNode {
    evaluate(env) {
        let value = this.evaluateChildren(env);
        env.trace(`store value: ${value}`);
        env.storeValue(value);
    }
}

class ReadNumNode extends NumberNode {
    constructor(n = 0) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }
    evaluate(env) {
        let n = this._nNode.evaluate(env);
        let result = env.readValueAt(n);
        env.trace(`read value[${n}]: ${result}`);
        return result;
    }
}

const READ_NUM_NODE = new ReadNumNode();
const READ_NUM_AT_NODE = n => new ReadNumNode(n);

class NumThatIsNode extends SkillEffectNode {
    /**
     * @param procedureNode
     * @param {number|NumberNode} value
     */
    constructor(procedureNode, value) {
        super(procedureNode, NumberNode.makeNumberNodeFrom(value));
    }

    evaluate(env) {
        let value = this.getChildren()[1].evaluate(env);
        env.storeValue(value);
        this.getChildren()[0].evaluate(env);
    }
}

class XNumNode extends SkillEffectNode {
    /**
     * @param {...SkillEffectNode} nodes
     */
    constructor(...nodes) {
        super(...(nodes.slice(0, -1)));
        // noinspection JSCheckFunctionSignatures
        let xNode = NumberNode.makeNumberNodeFrom(nodes[nodes.length - 1]);
        if (!(xNode instanceof NumberNode)) {
            console.error(`Last node must be a NumberNode but received: ${xNode.constructor.name}`);
        }
        this._numNode = xNode;
    }

    evaluate(env) {
        let value = this._numNode.evaluate(env);
        env.storeValue(value);
        env.trace(`store x value: ${value}`);
        this.evaluateChildren(env);
    }
}

const X_NUM_NODE = (...nodes) => new XNumNode(...nodes);

class ApplyXNode extends SkillEffectNode {
    constructor(xNode, node) {
        super();
        this._xNode = xNode;
        this._node = node;
    }
    evaluate(env) {
        let value = this._xNode.evaluate(env);
        env.storeValue(value);
        env.trace(`store x value: ${value}`);
        return this._node.evaluate(env);
    }
}

/**
 * xを評価してnodeを評価する。
 * nodeではREAD_NUMを使用してxの値を読み取る。
 * @template T
 * @param xNode
 * @param {T} node
 * @returns {T}
 */
const APPLY_X_NODE = (xNode, node) => new ApplyXNode(xNode, node);
