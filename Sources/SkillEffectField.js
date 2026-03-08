class SkillEffectField {
    /**
     * @enum {string}
     */
    static Op = {
        NONE: '',
        ADD: '+',
        SUB: '-',
        MUL: '*',
        MUL_TRUNC: 'Math.floor',
        DIV: '/',
        MOD: '%',
        AND: 'and',
        OR: 'or',
        SET_TRUE: 'true',
        SET_FALSE: 'false',
        STATS_OR: 'stats or',
        STATS_AND: 'stats and',
        ARRAY_PUSH: 'array push',
        ARRAY_ADD: 'array add',
        ARRAY_SUB: 'array sub',
        SET: 'set',
    };

    /**
     * @template T
     * @param {T} a
     * @param {T} b
     * @param {SkillEffectField.Op} op
     * @returns {T}
     */
    static calc(a, b, op) {
        switch (op) {
            case SkillEffectField.Op.ADD:
                return a + b;
            case SkillEffectField.Op.SUB:
                return a - b;
            case SkillEffectField.Op.MUL:
                return a * b;
            case SkillEffectField.Op.MUL_TRUNC:
                return Math.trunc(a * b);
            case SkillEffectField.Op.DIV:
                return a / b;
            case SkillEffectField.Op.MOD:
                return a % b;
            case SkillEffectField.Op.AND:
                return a && b;
            case SkillEffectField.Op.OR:
                return a || b;
            case SkillEffectField.Op.SET_TRUE:
                return true;
            case SkillEffectField.Op.SET_FALSE:
                return false;
            case SkillEffectField.Op.STATS_OR:
                return ArrayUtil.or(a, b);
            case SkillEffectField.Op.STATS_AND:
                return ArrayUtil.and(a, b);
            case SkillEffectField.Op.ARRAY_PUSH:
                a.push(b);
                return a;
            case SkillEffectField.Op.ARRAY_ADD:
                return ArrayUtil.add(a, b);
            case SkillEffectField.Op.ARRAY_SUB:
                return ArrayUtil.sub(a, b);
            case SkillEffectField.Op.SET:
                return b;
            default:
                throw new Error(`Invalid op: ${op}`);
        }
    }
}

/**
 * @typedef {BoolResolvable|NumberResolvable|StatsNode|StatusEffectType} SkillEffectFieldType
 * @abstract
 */
class SkillEffectFieldNode extends SingleEffectNode {
    /**
     * @param {string} key
     * @returns {SkillEffectFieldNode}
     */
    setKey(key) {
        const copy = this.clone();
        copy._key = key;
        return copy;
    }

    /**
     * @param logMessage
     * @returns {SkillEffectFieldNode}
     */
    setLogMessage(logMessage) {
        this._logMessage = logMessage;
        return this;
    }

    /**
     * @param {function} logMessageFunc
     * @returns {SkillEffectFieldNode}
     */
    setLogMessageFunc(logMessageFunc) {
        this._logMessageFunc = logMessageFunc;
        return this;
    }

    battleContext() {
        this._isBattleContext = true;
        return this;
    }

    _toLog(value) {
        if (Array.isArray(value)) {
            return `[${value.join(', ')}]`;
        }
        return value;
    }
}

class GetSkillEffectFieldNode extends SkillEffectFieldNode {
    onEvaluate(unit, env) {
        const targetObj = this._isBattleContext ? unit.battleContext : unit;

        // 文字列キーを使ってアクセス
        const result = targetObj[this._key];
        if (this._logMessageFunc) {
            env.debug(`${this._logMessageFunc(unit.nameWithGroup, result)}`);
        } else {
            env.debug(`${unit.nameWithGroup}の${this._logMessage} : ${this._toLog(result)}`);
        }
        return result;
    }
}

class ModSkillEffectFieldNode extends SkillEffectFieldNode {
    /**
     * @param {NumberResolvable|BoolResolvable} operand
     * @param {SkillEffectField.Op} op
     */
    constructor(operand, op) {
        super();
        this._operandNode = null;
        if (!(operand instanceof SkillEffectNode)) {
            if (typeof operand === 'boolean') {
                this._operandNode = BoolNode.makeBoolNodeFrom(operand);
            } else if (typeof operand === 'number') {
                this._operandNode = NumberNode.makeNumberNodeFrom(operand);
            } else {
                throw new Error(`Invalid operand: ${operand}, type: ${typeof operand}`);
            }
        } else {
            this._operandNode = operand;
        }
        this._operandNode?.addParent(this);
        this._op = op;
        this._isBattleContext = false;
    }

    onEvaluate(unit, env) {
        const operand = this._transEvaluation(env, this._operandNode.evaluate(env));
        const targetObj = this._isBattleContext ? unit.battleContext : unit;

        // 文字列キーを使ってアクセス
        const beforeValue = targetObj[this._key];
        const originalValue = this._copy(beforeValue);
        const result = targetObj[this._key] = SkillEffectField.calc(beforeValue, operand, this._op);
        if (this._logMessageFunc) {
            env.info(`${this._logMessageFunc(unit.nameWithGroup, operand)}
                : ${this._toLog(originalValue)} → ${this._toLog(result)}`);
        } else {
            env.info(`${unit.nameWithGroup}は${this._logMessage}${this._toLog(operand)}
                : ${this._toLog(originalValue)} → ${this._toLog(result)}`);
        }
        return result;
    }

    _copy(value) {
        if (Array.isArray(value)) {
            return [...value];
        }
        return value;
    }
}
