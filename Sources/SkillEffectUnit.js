class SkillOwnerUnitNode extends UnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.skillOwner;
    }

    /**
     * @override
     */
    evaluate(env) {
        return env.skillOwner;
    }
}

const SKILL_OWNER = new SkillOwnerUnitNode();

class TextUnitNode extends UnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.textUnit;
    }

    /**
     * @override
     */
    evaluate(env) {
        return env.textUnit;
    }
}

const UNIT = new TextUnitNode();

class TextFoeNode extends UnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.textFoe;
    }

    /**
     * @override
     */
    evaluate(env) {
        return env.textFoe;
    }
}

const FOE = new TextFoeNode();

class TextAllyNode extends UnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.textAlly;
    }

    /**
     * @override
     */
    evaluate(env) {
        return env.textAlly;
    }
}

const ALLY = new TextAllyNode();

class TargetAllyNode extends UnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.assistTarget;
    }

    /**
     * @override
     */
    evaluate(env) {
        return env.assistTarget;
    }
}

const TARGET_ALLY = new TargetAllyNode();

const ALLIES = UNIT.sameGroup();
const FOES = UNIT.differentGroup();

// TODO: リファクタリング
class UnitsWithinNode extends UnitsNode {
    constructor() {
        super();
        this._centerUnitNode = null;
        this._isWithinSpaces = false;
        this._spacesNode = null;
        this._isWithinRowOrColumn = false;
        this._rowNode = null;
        this._columnNode = null;
    }

    /**
     * @param {NumberResolvable} spaces
     * @return {UnitsWithinNode}
     */
    spaces(spaces) {
        const clone = this.clone();
        clone._isWithinSpaces = true;
        clone._spacesNode = NumberNode.toNumberNode(spaces);
        return clone;
    }

    /**
     * @param {TargetUnitNode} units
     * @return {UnitsWithinNode}
     */
    of(units) {
        const clone = this.clone();
        clone._centerUnitNode = UnitsNode.toUnitsNode(units);
        return clone;
    }

    /**
     * 自分自身のコピーを作成する
     * @returns {this}
     */
    clone() {
        const copy = new this.constructor();
        Object.assign(copy, this);
        return copy;
    }

    evaluate(env) {
        if (!this._centerUnitNode) {
            throw new Error('center unit node is not set in AlliesWithinNode');
        }
        const centerUnits = Array.from(this._centerUnitNode.evaluate(env));
        env.debug(`center units: ${centerUnits.map(u => u.getNameWithGroupAndPos()).join(", ")}`);
        /** @type {Set<Unit>} */
        const result = new Set();
        let spaces = this._getSpaces(env);

        for (const centerUnit of centerUnits) {
            env.trace(`center unit: ${centerUnit.getNameWithGroupAndPos()}`);
            if (!(centerUnit instanceof Unit)) {
                throw new Error(`[AlliesWithinNode] Invalid centerUnit: ${centerUnit}. Must be an instance of Unit.`);
            }
            for (const ally of this._getUnits(env, centerUnit, spaces)) {
                result.add(ally);
            }
        }
        env.debug(`allies within: ${Array.from(result).map(u => u.getNameWithGroupAndPos()).join(', ')}`);
        return result;
    }

    _getSpaces(env) {
        if (this._isWithinSpaces) {
            if (!this._spacesNode) {
                throw new Error('spaces node is not set in AlliesWithinNode');
            }
            return this._spacesNode.evaluate(env);
        } else {
            throw new Error('range is not set in AlliesWithinNode');
        }
    }

    _targetUnits(env) {
        return env.getUnitQuery().onMap();
    }

    _getUnits(env, centerUnit, spaces) {
        return this._targetUnits(env).toIterator();
    }
}

class AlliesWithinNode extends UnitsWithinNode {
    /**
     * @override
     */
    _getUnits(env, centerUnit, spaces) {
        return this._targetUnits(env)
            .andSameGroup(UNIT.evaluate(env))
            .withinSpacesOf(centerUnit, spaces);
    }
}

const ALLIES_WITHIN = new AlliesWithinNode();

class FoesWithinNode extends UnitsWithinNode {
    /**
     * @override
     */
    _getUnits(env, centerUnit, spaces) {
        return this._targetUnits(env)
            .differentGroup(UNIT.evaluate(env))
            .withinSpacesOf(centerUnit, spaces);
    }
}

const FOES_WITHIN = new FoesWithinNode();

const CLOSEST_FOES = UNIT.closestFoes();

const MOD_UNIT_FIELD = (n, op) => new ModSkillEffectFieldNode(n, op);

/**
 * @template T
 */
class CallUnitFuncNode extends SingleEffectNode {
    /**
     * @param {function(Unit, ...T): void} actionFunc
     * @param {function(Unit, ...T): string} messageBuilder
     * @param {...T} args
     */
    constructor(actionFunc, messageBuilder, ...args) {
        super();
        this._actionFunc = actionFunc;
        this._messageBuilder = messageBuilder;
        this._args = args;
    }

    evaluate(env) {
        if (!this._targetNode) {
            throw new Error('target node is not set in CallUnitFuncNode');
        }
        const units = this._targetNode.evaluate(env);
        const args = this.#getArgs(this._args, env);
        for (const unit of units) {
            env.info(this._messageBuilder(unit, ...args));
            this._actionFunc(unit, ...args);
        }
    }

    #getArgs(args, env) {
        if (args.length === 1 && args[0] instanceof SkillEffectNode) {
            return args[0].evaluate(env);
        }
        return args;
    }
}

/*
 * 実装
 */

const GRANTS_BONUS_DURING_COMBAT = n => MOD_UNIT_FIELD(n, SkillEffectField.Op.ARRAY_ADD)
    .setKey(Unit.nameOf(unit => unit.spurs))
    .setLogMessage(`攻撃/速さ/守備/魔防+`);

const GRANTS_BONUS_ON_MAP = statsNode => CALL_UNIT_FUNC(
    (unit, ...stats) => unit.reserveToApplyBuffs(...stats),
    (unit, ...stats) =>
        `${unit.nameWithGroup}にバフ予約: [${stats}]`,
    statsNode
);

/**
 * 戦闘中、マップ上でのステータス加算（攻撃+4など）
 * @param {StatsNode} statsNode
 * @returns {EffectNode}
 */
const GRANTS_BONUS = statsNode =>
    IF_ELSE_EFFECT(IS_IN_COMBAT_PHASE_NODE,
        GRANTS_BONUS_DURING_COMBAT(statsNode),
        GRANTS_BONUS_ON_MAP(statsNode)
    );

const INFLICTS_PENALTY_DURING_COMBAT = n => MOD_UNIT_FIELD(n, SkillEffectField.Op.ARRAY_SUB)
    .setKey(Unit.nameOf(unit => unit.spurs))
    .setLogMessage(`攻撃/速さ/守備/魔防-`);

const INFLICTS_PENALTY_ON_MAP = statsNode => CALL_UNIT_FUNC(
    (unit, ...stats) => unit.reserveToApplyDebuffs(...stats.map(n => -n)),
    (unit, ...stats) =>
        `${unit.nameWithGroup}にデバフ予約: [${stats}]`,
    statsNode
);

/**
 * 戦闘中、マップ上でのステータス減算（攻撃-4など）
 * @param {StatsNode} statsNode
 * @returns {EffectNode}
 */
const INFLICTS_PENALTY = statsNode =>
    IF_ELSE_EFFECT(IS_IN_COMBAT_PHASE_NODE,
        INFLICTS_PENALTY_DURING_COMBAT(statsNode),
        INFLICTS_PENALTY_ON_MAP(statsNode)
    );

const CALL_UNIT_FUNC = (actionFunc, messageBuilder, ...args) =>
    new CallUnitFuncNode(actionFunc, messageBuilder, ...args);

/**
 * @param {NumberResolvable} n
 * @returns {SkillEffectFieldNode}
 * @constructor
 */
const NEUTRALIZES_N_PENALTY_EFFECTS = n => MOD_UNIT_FIELD(n, SkillEffectField.Op.ADD)
    .setKey(Unit.nameOf(unit => unit.reservedNegativeStatusEffectCountInOrder))
    .setLogMessageFunc(n => `戦闘中、不利な状態を上位${n}個解除`);

/**
 * @template {StatusEffectType} T
 * @param {...T} effects
 * @returns {SingleEffectNode}
 */
const GRANTS_STATUS_EFFECTS = (...effects) => CALL_UNIT_FUNC(
    (unit, ...es) => unit.reserveToAddStatusEffects(...es),
    (unit, ...es) =>
        `${unit.nameWithGroup}に${es.map(e => getStatusEffectName(e)).join(', ')}を付与予約`,
    ...effects
);

/**
 * @param {...StatusEffectType} effects
 * @returns {SingleEffectNode}
 */
const INFLICTS_STATUS_EFFECTS = (...effects) => GRANTS_STATUS_EFFECTS(...effects);

/**
 * @template {StatFlags} T
 * @param {T} statFlags
 * @returns {SingleEffectNode}
 */
const NEUTRALIZES_STAT_PENALTIES = statFlags => CALL_UNIT_FUNC(
    (unit, fs) => unit.setReservedDebuffFlagsToNeutralize(fs),
    (unit, fs) => `${unit.nameWithGroup}は弱化を解除予約: ${fs}`,
    statFlags
);
