class SkillEffectField {
    /**
     * @enum {string}
     */
    static Op = {
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
            default:
                throw new Error(`Invalid op: ${op}`);
        }
    }
}

/**
 * @abstract
 */
class SkillEffectFieldNode extends SingleEffectNode {
    /**
     * @param {string} key
     * @returns {SkillEffectFieldNode}
     */
    setKey(key) {
        this._key = key;
        return this;
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
}

class ModSkillEffectFieldNode extends SkillEffectFieldNode {
    /**
     * @param {NumberResolvable|BoolResolvable} n
     * @param {SkillEffectField.Op} op
     */
    constructor(n, op) {
        super();
        this._nNode = null;
        if (!(n instanceof SkillEffectNode)) {
            if (typeof n === 'boolean') {
                this._nNode = BoolNode.makeBoolNodeFrom(n);
            } else if (typeof n === 'number') {
                this._nNode = NumberNode.makeNumberNodeFrom(n);
            }
        } else {
            this._nNode = n;
        }
        this._op = op;
        this._isBattleContext = false;
    }

    battleContext() {
        this._isBattleContext = true;
        return this;
    }

    evaluate(env) {
        const n = this._transEvaluation(env, this._nNode.evaluate(env));
        for (const unit of this._targetNode.evaluate(env)) {
            const targetObj = this._isBattleContext ? unit.battleContext : unit;

            // 文字列キーを使ってアクセス
            const beforeValue = targetObj[this._key];
            const originalValue = this.#copy(beforeValue);
            const result = targetObj[this._key] = SkillEffectField.calc(beforeValue, n, this._op);
            if (this._logMessageFunc) {
                env.info(`${unit.nameWithGroup}は${this._logMessageFunc(n)}
                : ${this.#toLog(originalValue)} → ${this.#toLog(result)}`);
            } else {
                env.info(`${unit.nameWithGroup}は${this._logMessage}${n}
                : ${this.#toLog(originalValue)} → ${this.#toLog(result)}`);
            }
        }
    }

    #copy(value) {
        if (Array.isArray(value)) {
            return [...value];
        }
        return value;
    }

    #toLog(value) {
        if (Array.isArray(value)) {
            return `[${value.join(', ')}]`;
        }
        return value;
    }
}
