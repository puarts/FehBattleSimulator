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

// TODO: ログを出力させる
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

// TODO: 三単現の修正
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
        return MathUtil.ensureMin(super.evaluateChildren(env), 0);
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

// noinspection JSUnusedGlobalSymbols
class GteNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left >= right;
    }
}

// noinspection JSUnusedGlobalSymbols
class LtNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left < right;
    }
}

// noinspection JSUnusedGlobalSymbols
class LteNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left <= right;
    }
}

// noinspection JSUnusedGlobalSymbols
class EqNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left === right;
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

// TODO: 別ファイルに分ける

// TODO: 直接設定されたくない値をプライベートにする(targetUnitOrAlly, targetFoe)
// TODO: コンストラクタを設定するか検討する
class NodeEnv {
    static PHASE = Object.freeze({
        NULL_PHASE: 'NULL_PHASE',
        AT_START_OF_TURN: 'AT_START_OF_TURN',
        AFTER_COMBAT: 'AFTER_COMBAT',
    });

    // ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, OFF
    static LOG_LEVEL = Object.freeze({
        OFF: 1,
        FATAL: 2,
        ERROR: 3,
        WARN: 4,
        INFO: 5,
        DEBUG: 6,
        TRACE: 7,
        ALL: 8
    })

    /** @type {string} */
    phase = NodeEnv.PHASE.NULL_PHASE;
    /** @type {Unit} */
    #skillOwner = null;
    /** @type {Unit} */
    #target = null;
    // TODO: rename
    /** @type {Unit} */
    #unitDuringCombat = null;
    // TODO: rename
    /** @type {Unit} */
    #foeDuringCombat = null;
    /** @type {Unit} */
    #targetUnitOrAlly = null;
    /** @type {Unit} */
    #targetFoe = null;
    /** @type {Unit} */
    #referenceUnit = null;
    /** @type {UnitManager} */
    #unitManager = null;
    /** @type {BeginningOfTurnSkillHandler} */
    beginningOfTurnSkillHandler = null;
    /** @type {DamageCalculatorWrapper} */
    damageCalculatorWrapper = null;
    /** @type {DamageCalculator} */
    damageCalculator = null;
    /** @type {BattleSimulatorBase} */
    battleSimulatorBase = null;
    /** @type {PostCombatSkillHander} */
    postCombatHandler = null;
    /** @type {number|null} */
    damageType = null;
    /** @type {Tile|null} */
    tile = null;

    #logLevel = NodeEnv.LOG_LEVEL.OFF;

    /** @type {function(string): void} */
    #logFunc = (_message) => {
        // console.log(_message);
    };

    // TODO: 削除する
    setName(name) {
        this.name = name;
        return this;
    }

    copy(overrides = {}) {
        // 新しいインスタンスを作成
        const copyInstance = new NodeEnv();

        // 現在のインスタンスのプロパティをコピー
        Object.assign(copyInstance, this);

        // プライベートプロパティをコピー
        copyInstance.setSkillOwner(this.skillOwner);
        copyInstance.setTarget(this.target);
        copyInstance.setUnitsDuringCombat(this.unitDuringCombat, this.foeDuringCombat);
        copyInstance.setTargetUnitOrAlly(this.targetUnitOrAlly);
        copyInstance.setTargetFoe(this.targetFoe);
        copyInstance.setReferenceUnit(this.referenceUnit);
        copyInstance.unitManager = this.unitManager;
        copyInstance.setLogLevel(this.getLogLevel());
        copyInstance.setLogFunc(this.#logFunc);

        // 引数で渡されたオーバーライドのプロパティで上書き
        Object.assign(copyInstance, overrides);

        return copyInstance;
    }

    setUnitsDuringCombat(unit, foe) {
        // TODO: 自動的にターゲットに設定するか検討する
        this.#unitDuringCombat = unit;
        this.#foeDuringCombat = foe;
        return this;
    }

    get unitManager() {
        return this.#unitManager;
    }

    set unitManager(unitManager) {
        this.#unitManager = unitManager;
    }

    /**
     * @param {BeginningOfTurnSkillHandler} handler
     */
    setBeginningOfTurnSkillHandler(handler) {
        this.beginningOfTurnSkillHandler = handler;
        this.unitManager = handler.unitManager;
        this.setLogFunc((message) => this.beginningOfTurnSkillHandler.writeDebugLog(message));
    }

    /**
     * @param {DamageCalculator} damageCalculator
     */
    setDamageCalculator(damageCalculator) {
        this.damageCalculator = damageCalculator;
        this.unitManager = damageCalculator.unitManager;
    }

    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     */
    setDamageCalculatorWrapper(damageCalculator) {
        this.damageCalculatorWrapper = damageCalculator;
        this.unitManager = damageCalculator.unitManager;
        this.setLogFunc((message) => this.damageCalculatorWrapper.writeDebugLog(message));
    }

    /**
     * @param {BattleSimulatorBase} base
     */
    setBattleSimulatorBase(base) {
        this.battleSimulatorBase = base;
        this.unitManager = base.unitManager;
    }

    /**
     * @param {PostCombatSkillHander} handler
     */
    setPostCombatHandler(handler) {
        this.postCombatHandler = handler;
        this.unitManager = handler.unitManager;
    }

    get skillOwner() {
        return this.#skillOwner;
    }

    get target() {
        return this.#target;
    }

    get targetUnit() {
        return this.#target;
    }

    get targetUnitOrAlly() {
        return this.#targetUnitOrAlly;
    }

    get targetFoe() {
        return this.#targetFoe;
    }

    get unitDuringCombat() {
        return this.#unitDuringCombat;
    }

    get foeDuringCombat() {
        return this.#foeDuringCombat;
    }

    get referenceUnit() {
        return this.#referenceUnit;
    }

    setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit) {
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
        this.setUnitsDuringCombat(targetUnit, enemyUnit);
        return this;
    }

    setSkillOwner(skillOwnerUnit) {
        this.#skillOwner = skillOwnerUnit;
        this.updateTargetInfo();
        return this;
    }

    setTarget(target) {
        this.#target = target;
        this.updateTargetInfo();
        return this;
    }

    updateTargetInfo() {
        if (this.target && this.#skillOwner) {
            if (this.target.isSameGroup(this.#skillOwner)) {
                this.#targetUnitOrAlly = this.target;
            } else {
                this.#targetFoe = this.target;
            }
        }
        return this;
    }

    setTargetUnitOrAlly(unit) {
        this.#target = unit;
        return this;
    }

    setTargetFoe(foe) {
        this.#foeDuringCombat = foe;
        return this;
    }

    setReferenceUnit(unit) {
        this.#referenceUnit = unit;
        return this;
    }

    getDamageType() {
        return this.damageType;
    }

    /**
     * @param {number} damageType
     * @returns {NodeEnv}
     */
    setDamageType(damageType) {
        this.damageType = damageType;
        return this;
    }

    /**
     * @param {function(string): void} log
     * @returns {NodeEnv}
     */
    setLogFunc(log) {
        this.#logFunc = log;
        return this;
    }

    setLogLevel(level) {
        this.#logLevel = level;
        return this;
    }

    getLogLevel() {
        return this.#logLevel;
    }

    /**
     * @param {string} logLevel
     * @param {string} message
     */
    #log(logLevel, message) {
        let name = this.name ? `[${this.name}] ` : '';
        let logMessage = `[${logLevel.padEnd(5)}] ${name}${message}`;
        this.#logFunc(logMessage);

        if (this.damageCalculatorWrapper) {
            if (this.damageType !== null && this.damageType === DamageType.ActualDamage) {
                console.log(logMessage);
            }
        } else if (this.damageCalculator) {
            if (this.damageType !== null && this.damageType === DamageType.ActualDamage) {
                console.log(logMessage);
            }
        } else {
            console.log(logMessage);
        }
    }

    /**
     * @param {string} message
     */
    fatal(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.FATAL) return;
        this.#log('FATAL', message);
    }

    /**
     * @param {string} message
     */
    error(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.ERROR) return;
        this.#log('ERROR', message);
    }

    /**
     * @param {string} message
     */
    warn(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.WARN) return;
        this.#log('WARN', message);
    }

    /**
     * @param {string} message
     */
    info(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.INFO) return;
        this.#log('INFO', message);
    }

    /**
     * @param {string} message
     */
    debug(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.DEBUG) return;
        this.#log('DEBUG', message);
    }

    /**
     * @param {string} message
     */
    trace(message) {
        if (this.getLogLevel() < NodeEnv.LOG_LEVEL.TRACE) return;
        this.#log('TRACE', message);
    }

    // TODO: 予約が必要なフェーズを調べる
    isReservationNeededInThisPhase() {
        return [NodeEnv.PHASE.AT_START_OF_TURN, NodeEnv.PHASE.AFTER_COMBAT].includes(this.phase);
    }
}

// TODO: rename. ex) DuringCombatEnv, AtStartOfCombatEnv
class DamageCalculatorWrapperEnv extends NodeEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {boolean|null} calcPotentialDamage
     */
    constructor(damageCalculator, targetUnit, enemyUnit, calcPotentialDamage) {
        super();
        this.setDamageCalculatorWrapper(damageCalculator);
        this.setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit);
        this.calcPotentialDamage = calcPotentialDamage;
    }
}

class DamageCalculatorEnv extends NodeEnv {
    /**
     * @param {DamageCalculator} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     */
    constructor(damageCalculator, targetUnit, enemyUnit) {
        super();
        this.setDamageCalculator(damageCalculator);
        this.setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit);
    }
}

// TODO: rename
class BattleSimulatorBaseEnv extends NodeEnv {
    /**
     * @param {BattleSimulatorBase} battleSimulatorBase
     * @param {Unit} targetUnit
     */
    constructor(battleSimulatorBase, targetUnit) {
        super();
        this.setBattleSimulatorBase(battleSimulatorBase);
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
    }
}

class EnumerationEnv extends NodeEnv {
    /**
     * @param {UnitManager} unitManager
     * @param {Unit} targetUnit
     */
    constructor(unitManager, targetUnit) {
        super();
        this.unitManager = unitManager;
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
    }
}

// TODO: rename
class ForFoesEnv extends NodeEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {Unit} enemyAllyUnit
     * @param {boolean} calcPotentialDamage
     */
    constructor(damageCalculator,
                targetUnit, enemyUnit, enemyAllyUnit,
                calcPotentialDamage) {
        super();
        this.setDamageCalculatorWrapper(damageCalculator);

        this.setSkillOwner(enemyAllyUnit);
        this.setTarget(targetUnit);
        this.setUnitsDuringCombat(enemyUnit, targetUnit);
        this.calcPotentialDamage = calcPotentialDamage;
    }
}

// TODO: rename
class ForAlliesEnv extends NodeEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {Unit} allyUnit
     */
    constructor(damageCalculator, targetUnit, enemyUnit, allyUnit) {
        super();
        this.setDamageCalculatorWrapper(damageCalculator);
        this.setSkillOwner(allyUnit);
        this.setTarget(targetUnit);
        this.setUnitsDuringCombat(targetUnit, enemyUnit);
    }
}

class PreventingStatusEffectEnv extends NodeEnv {
    /**
     * @param {Unit} skillOwnerUnit
     * @param {Unit} targetUnit
     * @param {number} statusEffect
     */
    constructor(skillOwnerUnit, targetUnit, statusEffect) {
        super();
        this.setSkillOwner(skillOwnerUnit);
        this.setTarget(targetUnit);
        this.statusEffect = statusEffect;
    }
}

class NeutralizingEndActionEnv extends NodeEnv {
    /**
     * @param {Unit} skillOwnerUnit
     * @param {Unit} targetUnit
     */
    constructor(skillOwnerUnit, targetUnit) {
        super();
        this.setSkillOwner(skillOwnerUnit)
        this.setTarget(targetUnit);
    }
}

class IsThereAllyWithinNRowsOrNColumnsCenteredOnUnitNode extends BoolNode {
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }

    /**
     * @param {DamageCalculatorWrapperEnv|NodeEnv} env
     */
    evaluate(env) {
        let result = env.unitManager.isThereAllyInCrossOf(env.target, Math.trunc(this.#n / 2));
        let n = this.#n;
        env.debug(`${env.target.nameWithGroup}を中心とした縦${n}列と横${n}列に味方がいるか: ${result}`);
        return result;
    }
}

const IS_THERE_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE = new IsThereAllyWithinNRowsOrNColumnsCenteredOnUnitNode(3);

class NumOfFoesWithinNRowsOrNColumnsCenteredOnUnitNode extends NumberNode {
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }

    /**
     * @param {DamageCalculatorWrapperEnv|NodeEnv} env
     */
    evaluate(env) {
        let unit = env.target;
        let n = this.#n;
        let result = env.unitManager.countEnemiesInCrossWithOffset(unit, Math.trunc(n / 2));
        env.debug(`${env.target.nameWithGroup}を中心とした縦${n}列と横${n}列にいる敵の数: ${result}`);
        return result;
    }
}

const NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE = new NumOfFoesWithinNRowsOrNColumnsCenteredOnUnitNode(3);

class NumOfAlliesWithinNRowsOrNColumnsCenteredOnUnitNode extends NumberNode {
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }

    /**
     * @param {DamageCalculatorWrapperEnv|NodeEnv} env
     */
    evaluate(env) {
        let unit = env.target;
        let n = this.#n;
        let result = env.unitManager.countAlliesInCrossWithOffset(unit, Math.trunc(n / 2));
        env.debug(`${env.target.nameWithGroup}を中心とした縦${n}列と横${n}列にいる味方の数: ${result}`);
        return result;
    }
}

const NUM_OF_ALLIES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE = new NumOfAlliesWithinNRowsOrNColumnsCenteredOnUnitNode(3);

class IsThereSpaceWithinNSpacesSatisfyCondNode extends BoolNode {
    /**
     * @param {number} distance
     * @param {(t: Tile) => boolean} pred
     */
    constructor(distance, pred) {
        super();
        this._distance = distance;
        this._pred = pred;
    }

    /**
     * @param {DamageCalculatorWrapperEnv|NodeEnv} env
     */
    evaluate(env) {
        let tiles =
            env.damageCalculatorWrapper.map.enumerateTilesWithinSpecifiedDistance(env.target.placedTile, this._distance);
        let result = GeneratorUtil.some(tiles, this._pred);
        env.debug(`${env.target.nameWithGroup}の周囲${this._distance}マス以内に条件を満たすマスが存在するか: ${result}`)
        return result;
    }
}

class IsThereSpaceWithinNSpacesThatHasDivineVeinOrCountsAsDifficultTerrainExcludingImpassableTerrainNode extends IsThereSpaceWithinNSpacesSatisfyCondNode {
    /**
     * @param {number} distance
     */
    constructor(distance) {
        let pred = tile =>
            tile.hasDivineVein() ||
            (tile.isPassableAnyMoveType() && tile.isCountedAsDifficultTerrain());
        super(distance, pred);
    }
}

const IS_THERE_SPACE_WITHIN_2_SPACES_THAT_HAS_DIVINE_VEIN_OR_COUNTS_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN_NODE =
    new IsThereSpaceWithinNSpacesThatHasDivineVeinOrCountsAsDifficultTerrainExcludingImpassableTerrainNode(2);

class IsAllyWithinNRowsOrNColumnsCenteredOnUnitNode extends BoolNode {
    // TODO: 定数を使用するのかNodeを使用するのか統一する
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }

    /**
     * @param {ForAlliesEnv|NodeEnv} env
     */
    evaluate(env) {
        let unit = env.target;
        let n = this.#n
        let result = unit.isInCrossWithOffset(env.skillOwner, Math.trunc(n / 2));
        env.debug(`${env.skillOwner.nameWithGroup}の縦${n}列と横${n}列の範囲に${unit.nameWithGroup}がいるか: ${result}`);
        return result;
    }
}

const IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE = new IsAllyWithinNRowsOrNColumnsCenteredOnUnitNode(3);

/**
 * number of allies adjacent to unit
 */
const NUMBER_OF_TARGET_ALLIES_ADJACENT_TO_TARGET = new class extends NumberNode {
    getUnit(env) {
        return env.target;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = env.unitManager.countAlliesWithinSpecifiedSpaces(unit, 1);
        env.debug(`${unit.nameWithGroup}の周囲1マスの味方の数: ${result}`);
        return result;
    }
}();

// 周囲のユニット

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

class CantoEnv extends NodeEnv {
    /**
     * @param {Unit} targetUnit
     */
    constructor(targetUnit) {
        super();
        this.setTarget(targetUnit);
    }
}

class CantoControlEnv extends NodeEnv {
    /**
     * @param {Unit} targetUnit
     * @param {Unit} unitThatControlCanto
     */
    constructor(targetUnit, unitThatControlCanto) {
        super();
        this.setSkillOwner(unitThatControlCanto);
        this.setTarget(targetUnit);
    }
}

class AtStartOfTurnEnv extends NodeEnv {
    /**
     * @param {BeginningOfTurnSkillHandler} handler
     * @param {Unit} targetUnit
     */
    constructor(handler, targetUnit) {
        super();
        this.phase = NodeEnv.PHASE.AT_START_OF_TURN;
        this.setBeginningOfTurnSkillHandler(handler);
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
    }
}

class AfterCombatEnv extends NodeEnv {
    /**
     * @param {PostCombatSkillHander} handler
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     */
    constructor(handler, targetUnit, enemyUnit) {
        super();
        this.phase = NodeEnv.PHASE.AFTER_COMBAT;
        this.setPostCombatHandler(handler);
        this.setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit);
    }
}

/**
 * @abstract
 */
class CalcMoveCountForCantoNode extends NumberNode {
    /**
     * @abstract
     * @param {CantoEnv|NodeEnv} env
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
        let unit = env.target;
        let result = env.target.restMoveCount + this.#n;
        env.debug(`${unit.nameWithGroup}の再移動距離: ${result} (${env.target.restMoveCount} + ${this.#n})`);
        return result;
    }
}

const CANTO_REM_PLUS_ONE_NODE = new CantoRem(1);

class CantoDistNode extends CalcMoveCountForCantoNode {
    /** @type {number} */
    #n;
    /** @type {number} */
    #max;

    /**
     * @param {number} n
     * @param {number} max
     */
    constructor(n, max) {
        super();
        this.#n = n;
        this.#max = max;
    }

    /**
     * @returns {number}
     */
    evaluate(env) {
        let unit = env.target;
        let dist = Unit.calcMoveDistance(unit)
        let result = MathUtil.ensureMax(dist + this.#n, this.#max);
        env.debug(`${unit.nameWithGroup}の再移動距離: ${dist} + ${this.#n}, max: ${this.#max}`);
        return result;
    }
}

const CANTO_DIST_PLUS_1_MAX_4_NODE = new CantoDistNode(1, 4);

const IS_COMBAT_INITIATED_BY_UNIT = new class extends BoolNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let result = unit.battleContext.initiatesCombat;
        env.debug(`${unit.nameWithGroup}から攻撃したか: ${result}`);
        return result;
    }
}();

/**
 * 【StatusEffect】is active on unit
 */
class IsStatusEffectActiveOnUnitNode extends BoolNode {
    /**
     * @param {number|NumberNode} value
     */
    constructor(value) {
        super(NumberNode.makeNumberNodeFrom(value));
    }

    evaluate(env) {
        let unit = env.unitDuringCombat;
        let statusEffect = this.evaluateChildren(env)[0];
        let result = unit.hasStatusEffect(statusEffect);
        env.debug(`${unit.nameWithGroup}が${getStatusEffectName(statusEffect)}を持っているか: ${result}`);
        return result;
    }
}

const HAS_UNIT_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE = new class extends BoolNode {
    /**
     * @param {BattleSimulatorBaseEnv|NodeEnv} env
     */
    evaluate(env) {
        let unit = env.target;
        let result = unit.isCombatDone;
        env.debug(`${unit.nameWithGroup}が現在ターン中に自分が戦闘を行なっているか: ${result}`);
        return result;
    }
}();

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

const CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE = new class extends BoolNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let result = unit.hasNormalAttackSpecial();
        env.debug(`${unit.nameWithGroup}が攻撃時に発動する奥義を装備しているか: ${result}, 奥義: ${unit.specialInfo?.name}`);
        return result;
    }
}();

/**
 * @abstract
 */
class ApplyingNumberNode extends SkillEffectNode {
    /**
     * @param {number|NumberNode} value
     */
    constructor(value) {
        super(NumberNode.makeNumberNodeFrom(value));
    }

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

// noinspection JSUnusedGlobalSymbols
class GrantsStatsPlusToUnitDuringCombatNode extends FromPositiveNumbersNode {
    evaluate(env) {
        let amounts = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...amounts);
        env.debug(`${unit.nameWithGroup}の攻撃/速さ/守備/魔防+[${amounts}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

class GrantsStatsPlusNToUnitDuringCombatNode extends SkillEffectNode {
    /**
     * @param {number|NumberNode} n
     * @param {[number, number, number, number]} ratios
     */
    constructor(n, ratios) {
        super(NumberNode.makeNumberNodeFrom(n));
        this.ratios = [...ratios];
    }

    evaluate(env) {
        let amount = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let beforeSpurs = unit.getSpurs();
        let amounts = this.ratios.map(r => amount * r);
        unit.addSpurs(...amounts);
        env.debug(`${unit.nameWithGroup}の攻撃/速さ/守備/魔防+[${amounts}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

class GrantsAllStatsPlusToUnitDuringCombatNode extends FromPositiveNumberNode {
    evaluate(env) {
        let amount = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let beforeSpurs = unit.getSpurs();
        unit.addAllSpur(amount);
        env.debug(`${unit.nameWithGroup}の攻撃/速さ/守備/魔防+${amount}: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

const GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE = new GrantsAllStatsPlusToUnitDuringCombatNode(4);
const GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE = new GrantsAllStatsPlusToUnitDuringCombatNode(5);

class GrantsAtkSpdPlusToUnitDuringCombatNode extends FromPositiveNumbersNode {
    evaluate(env) {
        let evaluatedArray = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let beforeSpurs = unit.getSpurs();
        unit.addAtkSpdSpurs(...evaluatedArray);
        env.debug(`${unit.nameWithGroup}の攻撃速さ+${evaluatedArray}: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

const UNIT_GRANTS_ATK_SPD_PLUS_4_TO_UNIT_DURING_COMBAT_NODE = new GrantsAtkSpdPlusToUnitDuringCombatNode(4);
const UNIT_GRANTS_ATK_SPD_PLUS_5_TO_UNIT_DURING_COMBAT_NODE = new GrantsAtkSpdPlusToUnitDuringCombatNode(5);
const UNIT_GRANTS_ATK_SPD_PLUS_6_TO_UNIT_DURING_COMBAT_NODE = new GrantsAtkSpdPlusToUnitDuringCombatNode(6);
const UNIT_GRANTS_ATK_SPD_PLUS_7_TO_UNIT_DURING_COMBAT_NODE = new GrantsAtkSpdPlusToUnitDuringCombatNode(7);

/**
 * @abstract
 */
class StatsNode extends SkillEffectNode {
    /**
     * @param {number|NumberNode} atk
     * @param {number|NumberNode} spd
     * @param {number|NumberNode} def
     * @param {number|NumberNode} res
     */
    static makeStatsNodeFrom(atk, spd, def, res) {
        return new class extends StatsNode {
            constructor(atk, spd, def, res) {
                super(...[atk, spd, def, res].map(n => NumberNode.makeNumberNodeFrom(n)));
            }
        }(atk, spd, def, res);
    }

    /**
     * @abstract
     * @param {NodeEnv} env
     * @return {[number, number, number, number]}
     */
    evaluate(env) {
        let result = super.evaluate(env);
        env.trace(`各要素を評価: [${result}]`)
        return result;
    }
}

class GrantsGreatTalentsPlusToTargetNode extends SkillEffectNode {
    /**
     * @param {StatsNode} statsNode
     * @param {StatsNode} maxStatsNode
     */
    constructor(statsNode, maxStatsNode) {
        super(statsNode, maxStatsNode);
    }

    /**
     * @param {NodeEnv} env
     * @returns {[[number, number, number, number], [number, number, number, number]]}
     */
    evaluateChildren(env) {
        return super.evaluateChildren(env);
    }

    evaluate(env) {
        let [values, maxValues] = this.evaluateChildren(env);
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}への大器の予約を開始: ターン開始前 [${unit.getGreatTalents()}]`);
        env.trace(`現在の予約: [${unit.getReservedGreatTalents()}], max [${unit.getReservedMaxGreatTalents()}]`);
        env.trace(`大器を予約: [${values}], max [${maxValues}]`);
        unit.reserveToAddGreatTalentsFrom(values, maxValues);
        env.debug(`反映後予約: [${unit.getReservedGreatTalents()}], max [${unit.getReservedMaxGreatTalents()}]`);
        env.trace(`${unit.nameWithGroup}へ大器を予約処理を終了`);
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

// 自分の最初の追撃前に奥義発動カウント-N(符号に注意Nは自然数)
class UnitGrantsSpecialCooldownMinusNToUnitBeforeUnitsFirstFollowUpAttackNode extends FromPositiveNumberNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.targetUnit;
        unit.battleContext.specialCountReductionBeforeFollowupAttack += n;
        let reduction = unit.battleContext.specialCountReductionBeforeFollowupAttack;
        env.debug(`${unit.nameWithGroup}は自分の最初の追撃前に自身の奥義発動カウント-${n}: ${reduction - n} => ${reduction}`);
    }
}

const UNIT_GRANTS_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_FOLLOW_UP_ATTACK_NODE =
    new UnitGrantsSpecialCooldownMinusNToUnitBeforeUnitsFirstFollowUpAttackNode(1);

const FOE_CANNOT_COUNTERATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}は反撃不可`);
        unit.battleContext.invalidatesCounterattack = true;
    }
}();

class InflictsStatsMinusOnUnitDuringCombatNode extends FromPositiveNumbersNode {
    evaluate(env) {
        let spurs = this.evaluateChildren(env);
        let unit = env.target;
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...spurs.map(v => -v));
        env.debug(`${unit.nameWithGroup}は攻撃/速さ/守備/魔坊-[${spurs}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

class InflictsStatsMinusOnFoeDuringCombatNode extends FromPositiveNumbersNode {
    evaluate(env) {
        let spurs = this.evaluateChildren(env);
        let unit = env.foeDuringCombat;
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...spurs.map(v => -v));
        env.debug(`${unit.nameWithGroup}の攻撃/速さ/守備/魔防-[${spurs}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

class InflictsStatsMinusNOnFoeDuringCombatNode extends FromPositiveNumbersNode {
    /**
     * @param {number|NumberNode} n
     * @param {[number, number, number, number]} ratios
     */
    constructor(n, ratios) {
        super(NumberNode.makeNumberNodeFrom(n));
        this.ratios = [...ratios];
    }

    evaluate(env) {
        let amount = this.evaluateChildren(env);
        let unit = env.foeDuringCombat;
        let beforeSpurs = unit.getSpurs();
        let amounts = this.ratios.map(r => amount * r);
        unit.addSpurs(...amounts.map(v => -v));
        env.debug(`${unit.nameWithGroup}の攻撃/速さ/守備/魔防-[${amounts}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

class UnitsStatsAtStartOfCombatNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        let unit = env.unitDuringCombat;
        let stats = unit.getStatusesInPrecombat();
        let stat = stats[this.#index];
        env.debug(`${unit.nameWithGroup}の戦闘開始時ステータス: ${stat} ([${stats}][${this.#index}])`);
        return stat;
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_ATK_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Atk);
const UNITS_SPD_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const UNITS_DEF_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Def);
const UNITS_RES_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Res);

class UnitsStatsDuringCombat extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        return env.unitDuringCombat.getStatusesInCombat(env.foeDuringCombat)[this.#index];
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_ATK_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Atk);
const UNITS_SPD_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const UNITS_DEF_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Def);
// noinspection JSUnusedGlobalSymbols
const UNITS_RES_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Res);

class UnitsEvalStatsDuringCombatNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        let unit = env.unitDuringCombat;
        let stats = unit.getStatusesInCombat(env.foeDuringCombat);
        let stat = stats[this.#index];
        env.debug(`${unit.nameWithGroup}のステータス: ${stat} ([${stats}][${this.#index}])`);
        return stat;
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_EVAL_ATK_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Atk);
const UNITS_EVAL_SPD_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const UNITS_EVAL_DEF_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Def);
// noinspection JSUnusedGlobalSymbols
const UNITS_EVAL_RES_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Res);

class FoesEvalStatsDuringCombatNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        let unit = env.foeDuringCombat;
        let stats = unit.getStatusesInCombat(env.unitDuringCombat);
        let stat = stats[this.#index];
        env.debug(`${unit.nameWithGroup}のステータス: ${stat} ([${stats}][${this.#index}])`);
        return stat;
    }
}

// noinspection JSUnusedGlobalSymbols
const FOES_EVAL_ATK_DURING_COMBAT_NODE = new FoesEvalStatsDuringCombatNode(STATUS_INDEX.Atk);
const FOES_EVAL_SPD_DURING_COMBAT_NODE = new FoesEvalStatsDuringCombatNode(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const FOES_EVAL_DEF_DURING_COMBAT_NODE = new FoesEvalStatsDuringCombatNode(STATUS_INDEX.Def);
// noinspection JSUnusedGlobalSymbols
const FOES_EVAL_RES_DURING_COMBAT_NODE = new FoesEvalStatsDuringCombatNode(STATUS_INDEX.Res);

/**
 * @abstract
 */
class NumberWithUnitNode extends NumberNode {
    /**
     * @abstract
     * @param {NodeEnv} env
     * @returns {Unit}
     */
    getUnit(env) {
    }
}

/**
 * @abstract
 */
class CurrentSpecialCooldownCountDuringCombatNode extends NumberWithUnitNode {
    /**
     * @param {NodeEnv} env
     * @returns {number}
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.tmpSpecialCount;
        env.debug(`${unit.nameWithGroup}の現在の奥義発動カウント${result}`)
        return result;
    }
}

const UNITS_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT = new class extends CurrentSpecialCooldownCountDuringCombatNode {
    getUnit(env) {
        return env.unitDuringCombat;
    }
}();

// noinspection JSUnusedGlobalSymbols
const FOES_CURRENT_SPECIAL_COOLDOWN_COUNT_DURING_COMBAT = new class extends CurrentSpecialCooldownCountDuringCombatNode {
    getUnit(env) {
        return env.foeDuringCombat;
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

/**
 * @abstract
 */
class GreatTalentsNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    /**
     * @abstract
     * @param {NodeEnv} env
     * @return {Unit}
     */
    getUnit(env) {
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.getGreatTalent(this.#index);
        env.debug(`${unit.nameWithGroup}の大器: ${result} ([${unit.getGreatTalents()}][${this.#index}])`);
        return result;
    }
}

class UnitsGreatTalentsNode extends GreatTalentsNode {
    getUnit(env) {
        return env.unitDuringCombat;
    }
}

class FoesGreatTalentsNode extends GreatTalentsNode {
    getUnit(env) {
        return env.foeDuringCombat;
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_ATK_GREAT_TALENT_NODE = new UnitsGreatTalentsNode(STATUS_INDEX.Atk);
// noinspection JSUnusedGlobalSymbols
const UNITS_SPD_GREAT_TALENT_NODE = new UnitsGreatTalentsNode(STATUS_INDEX.Spd);
const UNITS_DEF_GREAT_TALENT_NODE = new UnitsGreatTalentsNode(STATUS_INDEX.Def);
// noinspection JSUnusedGlobalSymbols
const UNITS_RES_GREAT_TALENT_NODE = new UnitsGreatTalentsNode(STATUS_INDEX.Res);

// noinspection JSUnusedGlobalSymbols
const FOES_ATK_GREAT_TALENT_NODE = new FoesGreatTalentsNode(STATUS_INDEX.Atk);
// noinspection JSUnusedGlobalSymbols
const FOES_SPD_GREAT_TALENT_NODE = new FoesGreatTalentsNode(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const FOES_DEF_GREAT_TALENT_NODE = new FoesGreatTalentsNode(STATUS_INDEX.Def);
// noinspection JSUnusedGlobalSymbols
const FOES_RES_GREAT_TALENT_NODE = new FoesGreatTalentsNode(STATUS_INDEX.Res);

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

// noinspection JSUnusedGlobalSymbols
/**
 * neutralizes effects that guarantee foe's follow-up attacks during combat.
 */
const UNIT_NEUTRALIZES_EFFECTS_THAT_GUARANTEE_FOES_FOLLOW_UP_ATTACKS_DURING_COMBAT_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        // 敵の絶対追撃を無効
        env.unitDuringCombat.battleContext.invalidatesAbsoluteFollowupAttack = true;
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
class IncreasesSpdDiffNecessaryForFoesFollowUpNode extends FromNumberNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        let n = this.evaluateChildren(env);
        unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack += n;
        env.debug(`${unit.nameWithGroup}の追撃の速さ条件+${n}: ${unit.battleContext.additionalSpdDifferenceNecessaryForFollowupAttack}`);
    }
}

/**
 * @abstract
 */
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

/**
 * @abstract
 */
class ApplyingNumberToEachStatNode extends FromNumbersNode {
    /**
     * @param {number|NumberNode} atk
     * @param {number|NumberNode} spd
     * @param {number|NumberNode} def
     * @param {number|NumberNode} res
     */
    constructor(atk, spd, def, res) {
        super(...[atk, spd, def, res].map(v => NumberNode.makeNumberNodeFrom(v)));
    }
}

/**
 * neutralizes penalties to unit's Atk/Spd
 */
class UnitNeutralizesPenaltiesToUnitsStatsNode extends SetBoolToEachStatusNode {
    evaluate(env) {
        let values = this.getValues();
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}は自身の弱化を無効: [${values}]`);
        unit.battleContext.invalidateOwnDebuffs(...this.getValues());
    }
}

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

/**
 * number of【Bonus】effects active on unit, excluding stat bonuses + number of【Penalty】effects active on foe, excluding stat penalties
 */
const NUM_OF_BONUS_ON_UNIT_PLUS_NUM_OF_PENALTY_ON_FOE_EXCLUDING_STAT_NODE = new class extends NumberNode {
    evaluate(env) {
        return env.unitDuringCombat.getPositiveStatusEffects().length + env.foeDuringCombat.getNegativeStatusEffects().length;
    }
}();

const NUM_OF_BONUS_ON_UNIT_AND_FOE_EXCLUDING_STAT_NODE = new class extends NumberNode {
    evaluate(env) {
        return env.unitDuringCombat.getPositiveStatusEffects().length + env.foeDuringCombat.getPositiveStatusEffects().length;
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
class UnitDealsDamageExcludingAoeSpecialsNode extends ApplyingNumberNode {
    getDescription(n) {
        return `与えるダメージ+${n}`;
    }

    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        let context = unit.battleContext;
        let beforeValue = context.additionalDamage;
        context.additionalDamage += n;
        env.debug(`${unit.nameWithGroup}は${this.getDescription(n)}: ${beforeValue} => ${context.additionalDamage}`);
    }
}

class UnitReducesDamageExcludingAoeSpecialsNode extends ApplyingNumberNode {
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

/**
 * reduces damage from foe's first attack by X% during combat
 * ("First attack" normally means only the first strike; for effects that grant "unit attacks twice," it means the first and second strikes.)
 */
class UnitReducesDamageFromFoesFirstAttackByNPercentDuringCombatNode extends ApplyingNumberNode {
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
class ReducesDamageFromFoesFirstAttackByNDuringCombatNode extends ApplyingNumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let n = this.evaluateChildren(env);
        unit.battleContext.damageReductionValueOfFirstAttacks += n;
        let reduction = unit.battleContext.damageReductionValueOfFirstAttacks;
        env.debug(`${unit.nameWithGroup}は最初に受けた攻撃と2回攻撃のダメージ-${n}: ${reduction - n} => ${reduction}`);
    }
}

class UnitReducesDamageWhenFoesSpecialExcludingAoeSpecialNode extends ApplyingNumberNode {
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

class UnitDealsDamageWhenTriggeringSpecialDuringCombatPerAttackNode extends ApplyingNumberNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        unit.battleContext.additionalDamageOfSpecialPerAttackInCombat += n;
        let damage = unit.battleContext.additionalDamageOfSpecialPerAttackInCombat;
        env.debug(`${unit.nameWithGroup}は戦闘中、自分の奥義によるダメージ+${n}: ${damage - n} => ${damage}`);
    }
}

/**
 * Reduces damage from attacks during combat by percentage = N
 */
class ReducesDamageDuringCombatByPercentageNBySpecialPerAttackNode extends FromNumberEnsuredNonNegativeNode {
    evaluate(env) {
        let n = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        unit.battleContext.damageReductionRatiosBySpecialPerAttack.push(n / 100.0);
        env.debug(`${unit.nameWithGroup}はこの攻撃の際にダメージを${n}%軽減(奥義扱い): ratios [${unit.battleContext.damageReductionRatiosBySpecialPerAttack}]`);
    }
}

class UnitRestoresHpToUnitAfterCombatNode extends ApplyingNumberNode {
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

const RESTORES_7_HP_TO_UNIT_AFTER_COMBAT_NODE = new UnitRestoresHpToUnitAfterCombatNode(7);

const NEUTRALIZES_FOES_REDUCES_DAMAGE_BY_PERCENTAGE_EFFECTS_FROM_FOES_NON_SPECIAL_EXCLUDING_AOE_SPECIALS_NODE = new class extends SkillEffectNode {
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

const NEUTRALIZES_SPECIAL_COOLDOWN_CHARGE_MINUS = new class extends SkillEffectNode {
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
        env.debug(`${unit.nameWithGroup}は距離に関係なく反撃する)`);
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
}

// BattleContextに値を設定

class CanTargetCanMakeFollowUpIncludingPotentNode extends BoolNode {
    getUnit(env) {
        return env.target
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.canFollowupAttackIncludingPotent();
        env.debug(`${unit.nameWithGroup}は追撃可能か: ${result}`);
        return result;
    }
}

const CAN_TARGET_CAN_MAKE_FOLLOW_UP_INCLUDING_POTENT_NODE = new CanTargetCanMakeFollowUpIncludingPotentNode();

// TODO: 命名規則を統一させる
class IfTargetTriggersAttacksTwiceNode extends BoolNode {
    getUnit(env) {
        return env.target
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.isTriggeringAttackTwice();
        env.debug(`${unit.nameWithGroup}は2回攻撃を発動しているか: ${result}`);
        return result;
    }
}

const IF_TARGET_TRIGGERS_ATTACKS_TWICE_NODE = new IfTargetTriggersAttacksTwiceNode();

// BattleContextの値を参照

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

class IsGteSumOfStatsDuringCombatExcludingPhantomNode extends BoolNode {
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
        env.debug(`${env.unitDuringCombat.nameWithGroup}と${env.foeDuringCombat.nameWithGroup}の虚勢なしでのステータスを比較`);
        let unitsStats = env.unitDuringCombat.getStatusesInCombat(env.foeDuringCombat);
        let foesStats = env.foeDuringCombat.getStatusesInCombat(env.unitDuringCombat);
        env.debug(`${env.unitDuringCombat.nameWithGroup}のステータス[${unitsStats}]`);
        env.debug(`${env.foeDuringCombat.nameWithGroup}のステータス[${foesStats}]`);
        let diffs = ArrayUtil.sub(unitsStats, foesStats);
        env.debug(`比較するステータスの倍率: [${this.#ratios}]`);
        let total = ArrayUtil.mult(diffs, this.#ratios).reduce((prev, curr) => prev + curr);
        env.debug(`${env.unitDuringCombat.nameWithGroup} - ${env.foeDuringCombat.nameWithGroup} = ${total}`);
        env.debug(`それぞれの補正: [${this.#unitAdd}, ${this.#foeAdd}]`);
        let result = total + this.#unitAdd - this.#foeAdd;
        env.debug(`${env.unitDuringCombat.nameWithGroup}-${env.foeDuringCombat.nameWithGroup} = ${result} >= 0 を満たすか: ${result >= 0}`);
        return result >= 0;
    }
}

// TODO: 汎用的なクラスにまとめる(GrantsStatsPlusAtStartOfTurnNode)
class GrantsStatsNode extends FromNumbersNode {
    evaluate(env) {
        let unit = env.target;
        let amounts = this.evaluateChildren(env);
        env.debug(`${unit.nameWithGroup}にバフを付与: [${amounts}]`);
        unit.applyBuffs(...amounts);
    }
}

class GrantsStatusEffectsNode extends FromNumbersNode {
    /**
     * @param {...number} values
     */
    constructor(...values) {
        super(...values);
    }

    evaluate(env) {
        this.evaluateChildren(env).forEach(e => {
            let unit = env.target;
            env.debug(`${unit.nameWithGroup}に${getStatusEffectName(e)}を付与`);
            unit.addStatusEffect(e)
        });
    }
}

const NEUTRALIZES_ANY_PENALTY_ON_UNIT_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}の弱化を解除`);
        unit.neutralizeAllDebuffs();
        env.debug(`${unit.nameWithGroup}の不利なステータスを解除`);
        unit.neutralizeNegativeStatusEffects();
    }
}();

class ForEachNode extends SkillEffectNode {
}

class ForEachUnitOnMapNode extends ForEachNode {
    /**
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} children
     */
    constructor(predNode, ...children) {
        super(...children);
        this._predNode = predNode;
    }

    /**
     * @param {NodeEnv} env
     * @returns {Generator<Unit>|Unit[]}
     */
    getUnits(env) {
        let pred = u => this._predNode.evaluate(env.copy().setTarget(u));
        return GeneratorUtil.filter(env.unitManager.enumerateAllUnitsOnMap(), pred);
    }

    evaluate(env) {
        for (let unit of this.getUnits(env)) {
            env.debug(`${unit.nameWithGroup}を対象に選択`);
            this.evaluateChildren(env.copy().setTarget(unit));
        }
    }
}

class ForEachAllyNode extends ForEachUnitOnMapNode {
    /**
     * @param {NodeEnv} env
     * @returns {Generator<Unit>|Unit[]}
     */
    getUnits(env) {
        let pred = u => this._predNode.evaluate(env.copy().setTarget(u));
        return GeneratorUtil.filter(env.unitManager.enumerateUnitsInTheSameGroup(env.target), pred);
    }
}

class ForEachUnitAndAllyNode extends ForEachUnitOnMapNode {
    /**
     * @param {NodeEnv} env
     * @returns {Generator<Unit>|Unit[]}
     */
    getUnits(env) {
        let pred = u => this._predNode.evaluate(env.copy().setTarget(u));
        return GeneratorUtil.filter(env.unitManager.enumerateUnitsInTheSameGroup(env.target, true), pred);
    }
}

class ForEachTargetAndOtherUnitWithinNSpacesOfTargetNode extends ForEachUnitAndAllyNode {
    /** @type {NumberNode} */
    _nNode;

    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} predNode
     * @param {SkillEffectNode} children
     */
    constructor(n, predNode, ...children) {
        super(predNode, ...children);
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    getUnits(env) {
        let unit = env.target;
        let spaces = this._nNode.evaluate(env);
        let units = env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, spaces, true);
        let unitArray = GeneratorUtil.toArray(units);
        env.debug(`${unit.nameWithGroup}と周囲${spaces}マスのユニット: [${unitArray.map(u => u.nameWithGroup)}]`);

        let filteredUnits = unitArray.filter(u => this._predNode.evaluate(env.copy().setTarget(u)));
        env.debug(`フィルター後の${unit.nameWithGroup}と周囲${spaces}マスのユニット: [${filteredUnits.map(u => u.nameWithGroup)}]`);
        return filteredUnits;
    }
}

class ForEachUnitAndAllyWithinNSpacesOfUnitNode extends ForEachTargetAndOtherUnitWithinNSpacesOfTargetNode {
    getUnits(env) {
        return super.getUnits(env.copy().setTarget(env.unitDuringCombat));
    }
}

// noinspection JSUnusedGlobalSymbols
class ForEachUnitAndAllyWithin1SpaceOfUnitNode extends ForEachUnitAndAllyWithinNSpacesOfUnitNode {
    constructor(predNode, ...children) {
        super(1, predNode, ...children);
    }
}

// noinspection JSUnusedGlobalSymbols
class ForEachUnitAndAllyWithin2SpacesOfUnitNode extends ForEachUnitAndAllyWithinNSpacesOfUnitNode {
    constructor(predNode, ...children) {
        super(2, predNode, ...children);
    }
}

class ForEachTargetAndFoeWithinNSpacesOfTargetNode extends ForEachTargetAndOtherUnitWithinNSpacesOfTargetNode {
    getUnits(env) {
        return super.getUnits(env.copy().setTarget(env.foeDuringCombat));
    }
}

class ForEachTargetAndFoeWithin1SpaceOfTargetNode extends ForEachTargetAndFoeWithinNSpacesOfTargetNode {
    constructor(predNode, ...children) {
        super(1, predNode, ...children);
    }
}

const FOR_EACH_TARGET_AND_FOE_WITHIN_1_SPACE_OF_TARGET_NODE =
    (...children) => new ForEachTargetAndFoeWithin1SpaceOfTargetNode(TRUE_NODE, ...children);

// noinspection JSUnusedGlobalSymbols
class ForEachTargetAndFoeWithin2SpacesOfTargetNode extends ForEachTargetAndFoeWithinNSpacesOfTargetNode {
    constructor(predNode, ...children) {
        super(2, predNode, ...children);
    }
}

class IsTargetWithinNRowsOrNColumnsCenteredOnSkillOwnerNode extends BoolNode {
    /**
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let unit = env.target;
        let n = this.evaluateChildren(env);
        let result = unit.isInCrossWithOffset(env.skillOwner, Math.trunc(n / 2));
        env.debug(`${env.skillOwner.nameWithGroup}の縦${n}列と横${n}列の範囲に${unit.nameWithGroup}がいるか: ${result}`);
        return result;
    }
}

const IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE =
    new IsTargetWithinNRowsOrNColumnsCenteredOnSkillOwnerNode(3);

class ForEachClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode extends ForEachUnitOnMapNode {
    constructor(n, predNode, ...children) {
        super(predNode, ...children);
        this._numberNode = NumberNode.makeNumberNodeFrom(n);
    }

    getUnits(env) {
        let enemies = env.unitManager.enumerateUnitsInDifferentGroupOnMap(env.target);
        let closestUnits = IterUtil.minElements(enemies, u => u.distance(env.target));
        env.debug(`最も近いユニット: ${closestUnits.map(u => u.nameWithGroup)}`);
        let allUnits = closestUnits.flatMap(u => {
            let n = this._numberNode.evaluate(env);
            let units = env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(u, n);
            let unitArray = GeneratorUtil.toArray(units);
            env.debug(`${u.nameWithGroup}の周囲${n}マスのユニット: ${unitArray.map(u => u.nameWithGroup)}`);
            return unitArray;
        });
        allUnits = [...new Set(closestUnits.concat(allUnits))];
        env.debug(`対象の全てのユニット: ${allUnits.map(u => u.nameWithGroup)}`);
        return allUnits;
    }
}

class ForEachClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode extends ForEachClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode {
    constructor(predNode, ...children) {
        super(2, predNode, ...children);
    }
}

const FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE =
    (...children) => new ForEachClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode(TRUE_NODE, ...children);

class ForEachUnitFromSameTitlesNode extends ForEachNode {
    /**
     * @param {EnumerationEnv|NodeEnv} env
     */
    evaluate(env) {
        for (let unit of env.unitManager.enumerateAlliesThatHaveSameOrigin(env.target)) {
            env.debug(`${unit.nameWithGroup}を対象に設定`);
            this.evaluateChildren(env.copy().setTarget(unit));
        }
    }
}

class AppliesPotentEffectNode extends FromNumbersNode {
    /**
     * @param {number|NumberNode} ratio
     * @param {number|NumberNode} spdDiff
     */
    constructor(ratio = 0.4, spdDiff = -25) {
        super(NumberNode.makeNumberNodeFrom(ratio), NumberNode.makeNumberNodeFrom(spdDiff));
    }

    /**
     * @param {DamageCalculatorWrapperEnv|NodeEnv} env
     */
    evaluate(env) {
        // 追撃の速さ条件を25した状態で追撃の速さ条件を満たしている時（絶対追撃、追撃不可は含まない）、
        // 戦闘中、【神速追撃：ダメージ●%】を発動（〇は、自分が2回攻撃でない、かつ追撃ができない時は80、それ以外は40）
        let [ratio, spdDiff] = this.evaluateChildren(env);
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}に神速スキル(${Math.trunc(ratio * 100)}%, 速さ条件${spdDiff})を適用`);
        return env.damageCalculatorWrapper.__applyPotent(unit, env.foeDuringCombat, ratio, spdDiff);
    }
}

// Tileへの効果

/**
 * applies【Divine Vein (Stone)】to unit's space and spaces within 2 spaces of unit for 1 turn.
 */
class AppliesDivineVeinNode extends SkillEffectNode {
    /**
     * TODO: 文字列を渡せるようにする
     * TODO: traceログを追加
     * @param {number} divineVein
     * @param {BoolNode} predNode
     */
    constructor(divineVein, predNode) {
        super(predNode);
        this._divineVein = divineVein;
    }

    getUnit(env) {
        return env.target;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        env.debug(`${unit.nameWithGroup}は天脈(${this._divineVein})を付与`);
        for (let tile of g_appData.map.enumerateTiles()) {
            let copyEnv = env.copy();
            copyEnv.tile = tile;
            if (this.evaluateChildren(copyEnv)[0]) {
                tile.reserveDivineVein(this._divineVein, unit.groupId);
            }
        }
    }
}

class IsTargetsSpaceAndSpacesWithinNSpacesOfTargetNode extends BoolNode {
    /**
     * TODO: traceログを追加
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let distance = env.tile.calculateDistance(env.target.placedTile);
        return distance <= this.evaluateChildren(env)[0];
    }
}

class IsTargetIsInSpaceWhereDivineVeinEffectIsAppliedNode extends BoolNode {
    getUnit(env) {
        return env.target;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let tile = unit.placedTile;
        let result = tile != null && tile.divineVein !== DivineVeinType.None;
        env.debug(`${unit.nameWithGroup}は天脈が付与されたマスにいるか: ${result}`);
        return result;
    }
}

const IS_TARGET_IS_IN_SPACE_WHERE_DIVINE_VEIN_EFFECT_IS_APPLIED_NODE = new IsTargetIsInSpaceWhereDivineVeinEffectIsAppliedNode();

// ターン開始時
// TODO: 以下の関数群をPhaseを見て予約するかどうか決定して汎用的なノードにする
class GrantsStatsPlusAtStartOfTurnNode extends ApplyingNumberToEachStatNode {
    evaluate(env) {
        let unit = env.target;
        let amounts = this.evaluateChildren(env);
        env.debug(`${unit.nameWithGroup}にバフ予約: [${amounts}]`);
        unit.reserveToApplyBuffs(...amounts);
    }
}

class InflictsStatsMinusAtStartOfTurnNode extends ApplyingNumberToEachStatNode {
    evaluate(env) {
        let unit = env.target;
        let amounts = this.evaluateChildren(env).map(v => -v);
        env.debug(`${unit.nameWithGroup}にデバフ予約: [${amounts}]`);
        unit.reserveToApplyDebuffs(...amounts);
    }
}

class GrantsStatusEffectAtStartOfTurnNode extends FromNumberNode {
    /**
     * @param {number} value
     */
    constructor(value) {
        super(value);
    }

    evaluate(env) {
        env.target.reserveToAddStatusEffect(this.evaluateChildren(env));
    }
}

// TODO: rename
class GrantsStatusEffectsAtStartOfTurnNode extends FromNumbersNode {
    /**
     * @param {...number} values
     */
    constructor(...values) {
        super(...values);
    }

    evaluate(env) {
        if (env.isReservationNeededInThisPhase()) {
            this.evaluateChildren(env).forEach(e => {
                let unit = env.target;
                env.debug(`${unit.nameWithGroup}に${getStatusEffectName(e)}を付与予約`);
                unit.reserveToAddStatusEffect(e);
            });
        } else {
            this.evaluateChildren(env).forEach(e => {
                let unit = env.target;
                env.debug(`${unit.nameWithGroup}に${getStatusEffectName(e)}を付与`);
                unit.addStatusEffect(e)
            });
        }
    }
}

class GrantsStatusEffectsAfterCombatNode extends GrantsStatusEffectsAtStartOfTurnNode {
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
     * @param {CantoControlEnv|NodeEnv} env
     */
    evaluate(env) {
        let result = env.target.distance(env.skillOwner) <= this.#n;
        env.debug(`${env.target.nameWithGroup}が${env.skillOwner.nameWithGroup}の${this.#n}マス以内にいるか: ${result}`);
        return result;
    }
}

const CAN_INFLICT_CANTO_CONTROL_WITHIN_4_SPACES_NODE = new CanInflictCantoControlWithinNSpacesNode(4);

class CanNeutralizeStatusEffectForUnitAndAlliesWithinNSpacesNode extends BoolNode {
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
     * @param {PreventingStatusEffectEnv|NodeEnv} env
     * @returns {boolean}
     */
    evaluate(env) {
        if (!env.targetUnitOrAlly || !env.skillOwner) return false;
        let isWithinSpaces = env.targetUnitOrAlly.distance(env.skillOwner) <= this.#n;
        env.debug(`${env.targetUnitOrAlly.nameWithGroup}が${env.skillOwner.nameWithGroup}の周囲${this.#n}マス以内にいるか: ${isWithinSpaces}`);
        let isTargetStatusEffect = env.statusEffect === this.#statusEffect;
        env.debug(`付与されようとしているステータス(${getStatusEffectName(env.statusEffect)})が無効対象のステータス(${getStatusEffectName(this.#statusEffect)})か: ${isTargetStatusEffect}`);
        let result = isTargetStatusEffect && isWithinSpaces;
        env.debug(`${env.targetUnitOrAlly.nameWithGroup}はステータス付与を防げるか: ${result}`);
        return result;
    }
}

const CAN_NEUTRALIZE_ACTION_ENDS_SKILL_FOR_UNIT_AND_ALLIES_WITHIN_3_SPACES_NODE =
    new CanNeutralizeStatusEffectForUnitAndAlliesWithinNSpacesNode(StatusEffectType.AfterStartOfTurnSkillsTriggerActionEndsImmediately, 3);

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
     * @param {NeutralizingEndActionEnv|NodeEnv} env
     * @returns {boolean}
     */
    evaluate(env) {
        if (!env.targetUnitOrAlly || !env.skillOwner) return false;
        let result = env.targetUnitOrAlly.distance(env.skillOwner) <= this.#n;
        env.debug(`${env.targetUnitOrAlly.nameWithGroup}が${env.skillOwner.nameWithGroup}の周囲${this.#n}マス以内にいるか: ${result}`);
        return result;
    }
}

const CAN_NEUTRALIZE_END_ACTION_WITHIN_3_SPACES_NODE = new CanNeutralizeEndActionWithinNSpacesNode(3);

const GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_1_IF_COUNT_IS_MAX_AT_START_OF_TURN_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        let isMax = unit.statusEvalUnit.isSpecialCountMax;
        env.debug(`奥義カウントが最大値の時${unit.nameWithGroup}の奥義カウント-1予約: ${unit.statusEvalUnit.specialCount}/${unit.statusEvalUnit.maxSpecialCount} (is max ${isMax})`);
        if (isMax) {
            unit.reserveToReduceSpecialCount(1);
        }
    }
}();

const GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_1_IF_COUNT_IS_MAX_AFTER_COMBAT_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        let isMax = unit.isSpecialCountMax;
        env.debug(`奥義カウントが最大値の時${unit.nameWithGroup}の奥義カウント-1予約: ${unit.specialCount}/${unit.maxSpecialCount} (is max ${isMax})`);
        if (isMax) {
            unit.reserveToReduceSpecialCount(1);
        }
    }
}();

// Hooks
// TODO: phase情報を入れる
/**
 * 戦闘開始時
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const AT_START_OF_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 再移動条件
 * @type {SkillEffectHooks<BoolNode, BattleSimulatorBaseEnv>} */
const CAN_TRIGGER_CANTO_HOOKS = new SkillEffectHooks();

/**
 * 再移動量
 * @type {SkillEffectHooks<NumberNode, CantoEnv>} */
const CALCULATES_DISTANCE_OF_CANTO_HOOKS = new SkillEffectHooks();

/**
 * ターン開始時
 * @type {SkillEffectHooks<SkillEffectNode, AtStartOfTurnEnv>} */
const AT_START_OF_TURN_HOOKS = new SkillEffectHooks();

/**
 * 戦闘前
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const PRE_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 再移動制限評価時
 * @type {SkillEffectHooks<BoolNode, CantoControlEnv>} */
const CAN_INFLICT_CANTO_CONTROL_HOOKS = new SkillEffectHooks();

/**
 * TODO: ステータス付与時に汎用的に使用できるフックに修正する
 * ステータス付与時
 * @type {SkillEffectHooks<BoolNode, PreventingStatusEffectEnv>} */
const CAN_NEUTRALIZE_STATUS_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * スキルによる行動停止無効
 * @type {SkillEffectHooks<BoolNode, NeutralizingEndActionEnv>} */
const CAN_NEUTRALIZE_END_ACTION_BY_SKILL_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * ステータスによる行動停止無効
 * @type {SkillEffectHooks<BoolNode, NeutralizingEndActionEnv>} */
const CAN_NEUTRALIZE_END_ACTION_BY_STATUS_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * 周囲に対する紋章効果
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const WHEN_GRANTS_STATS_PLUS_TO_ALLIES_DURING_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 周囲に対するスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const WHEN_GRANTS_EFFECTS_TO_ALLIES_DURING_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 周囲の敵から受ける紋章効果
 * @type {SkillEffectHooks<SkillEffectNode, ForFoesEnv>} */
const WHEN_INFLICTS_STATS_MINUS_TO_FOES_HOOKS = new SkillEffectHooks();

/**
 * ボタンを押したときのスキル効果
 * @type {MultiValueMap<number, SkillEffectNode>} */
const WHEN_TRIGGERS_DUO_OR_HARMONIZED_EFFECT_HOOKS_MAP = new MultiValueMap();

/**
 * 神速追撃
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_POTENT_EFFECTS_HOOKS = new SkillEffectHooks();

/**
 * 戦闘後
 * @type {SkillEffectHooks<SkillEffectNode, AfterCombatEnv>} */
const AFTER_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 戦闘ステータス決定後のバフ
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_EFFECTS_TO_STATS_AFTER_COMBAT_STATS_DETERMINED_HOOKS = new SkillEffectHooks();

/**
 * 戦闘ステータス決定後のスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_EFFECTS_AFTER_COMBAT_STATS_DETERMINED_HOOKS = new SkillEffectHooks();

/**
 * 戦闘開始時奥義
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const WHEN_APPLIES_SPECIAL_EFFECTS_AT_START_OF_COMBAT_HOOKS = new SkillEffectHooks();

/**
 * 攻撃開始時
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorEnv>} */
const AT_START_OF_ATTACK_HOOKS = new SkillEffectHooks();

/**
 * 攻撃開始時
 * @type {SkillEffectHooks<SkillEffectNode, NodeEnv>} */
const AFTER_UNIT_ACTS_IF_CANTO_TRIGGERS_AFTER_CANTO_HOOKS = new SkillEffectHooks();

/**
 * 戦闘開始時奥義
 * @type {SkillEffectHooks<SkillEffectNode, DamageCalculatorWrapperEnv>} */
const AFTER_FOLLOW_UP_CONFIGURED_HOOKS = new SkillEffectHooks();
