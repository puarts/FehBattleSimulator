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
     * @param {number|string|(number|string)[]} skillIds
     * @param {() => N} nodeFunc
     */
    addSkill(skillIds, nodeFunc) {
        if (typeof nodeFunc !== 'function') {
            throw new Error('Argument nodeFunc must be a function');
        }
        this.#delayedMap.addValue(skillIds, nodeFunc);
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
        }
        // TODO: 紋章士に対応する
        let name = g_appData.skillDatabase?.findSkillInfoByDict(suffix)?.name ?? `${skillId}`;
        env?.info(`${type}${name}を評価`);
    }

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {*[]}
     */
    evaluateWithUnit(unit, env) {
        // TODO: 付与されたステータスも入れるようにする
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

    /**
     * @param {Unit} unit
     * @param {E} env
     * @returns {[number, number, number, number]}
     */
    evaluateStatsSumWithUnit(unit, env) {
        return this.evaluateWithUnit(unit, env).reduce((a, b) => ArrayUtil.add(a, b), [0, 0, 0, 0]);
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

class PositiveNumberNode extends NumberNode {
    evaluate(env) {
        let number = super.evaluate(env);
        if (number < 0) {
            env.error(`Not a positive number: ${number}`);
        }
        return number;
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
     * @param {...number|NumberNode} values
     */
    constructor(...values) {
        super(...values.map(v => NumberNode.makeNumberNodeFrom(v)));
    }

    /**
     * @param env
     * @returns {number[]}
     */
    evaluateChildren(env) {
        return super.evaluateChildren(env);
    }

    /**
     * @param {NodeEnv} env
     * @abstract
     */
    evaluate(env) {
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
        super(BoolNode.makeBoolNodeFrom(value));
    }

    evaluate(env) {
        return !this.evaluateChildren(env)[0];
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
     * @param {...(number|NumberNode)} values
     */
    constructor(...values) {
        super(...values.map(v => NumberNode.makeNumberNodeFrom(v)));
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
        let value = this.evaluateChildren(env);
        let result = MathUtil.ensureMax(value, this.#max);
        env?.trace(`[EnsureMaxNode] (value: ${value}, max: ${this.#max}) => ${result}`);
        return result;
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
        let value = this.evaluateChildren(env);
        let result = MathUtil.ensureMinMax(value, this.#min, this.#max);
        env?.trace(`[EnsureMinMaxNode] (min: ${this.#min}, value: ${value}, max: ${this.#max}) => ${result}`);
        return result;
    }
}

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

class MaxNode extends NumberOperationNode {
    /**
     * @override
     * @returns {number}
     */
    evaluate(env) {
        let evaluated = super.evaluateChildren(env);
        let result = Math.max(...evaluated);
        env?.trace(`[MaxNode] max trunc [${[evaluated]}] = ${result}`);
        return result;
    }
}

const MAX_NODE = (...node) => new MaxNode(...node);

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
        return left === right;
    }
}

const EQ_NODE = (...node) => new EqNode(...node);

class IfNode extends SkillEffectNode {
    /** @type {BoolNode} */
    #condNode;

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

const IF_NODE = (condNode, ...stmtNodes) => new IfNode(condNode, ...stmtNodes);

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

class StoreNumNode extends FromNumberNode {
    evaluate(env) {
        let value = this.evaluateChildren(env);
        env.trace(`store value: ${value}`);
        env.storeValue(value);
    }
}

class ReadNumNode extends NumberNode {
    evaluate(env) {
        let result = env.readValue();
        env.trace(`read value: ${result}`);
        return result;
    }
}

const READ_NUM_NODE = new ReadNumNode();

class NumThatIsNode extends SkillEffectNode {
    /**
     * @param procedureNode
     * @param {NumberNode} valueNode
     */
    constructor(procedureNode, valueNode) {
        super(procedureNode, valueNode);
    }

    evaluate(env) {
        let value = this.getChildren()[1].evaluate(env);
        env.storeValue(value);
        this.getChildren()[0].evaluate(env);
    }
}