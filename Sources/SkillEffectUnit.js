class SkillOwnerUnitNode extends EnvUnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.skillOwner;
    }
}

const SKILL_OWNER = new SkillOwnerUnitNode();

class TextUnitNode extends EnvUnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.textUnit;
    }
}

const UNIT = new TextUnitNode();

class TextFoeNode extends EnvUnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.textFoe;
    }
}

const FOE = new TextFoeNode();
const TARGET_FOE = new TextFoeNode();

class TextAllyNode extends EnvUnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.textAlly;
    }
}

const ALLY = new TextAllyNode();

class TargetAllyNode extends EnvUnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.assistTarget;
    }
}

const TARGET_ALLY = new TargetAllyNode();

class TextTargetNode extends EnvUnitNode {
    /**
     * @override
     */
    getUnit(env) {
        return env.textTarget;
    }
}

const TARGET = new TextTargetNode();

const ALLIES = UNIT.sameGroup();
const ALLIES_ON_MAP = UNIT.sameGroup(); // sameGroupがマップ上のフィルタを行っている
const FOES = UNIT.differentGroup();

const SUPPORT_PARTNERS = UNIT.sameGroup()

// TODO: リファクタリング
class UnitsWithinNode extends UnitsNode {
    constructor() {
        super();
        /** @type {UnitsNode} */
        this._centerNode = null;
        /** @type {Array<(query: UnitQuery, centerUnit: Unit, env: NodeEnv) => UnitQuery>} */
        this._filters = [];
    }

    /**
     * @param {NumberResolvable} spaces
     * @return {this}
     */
    spaces(spaces) {
        let clone = this.clone();
        const spacesNode = NumberNode.toNumberNode(spaces);
        clone._filters.push(
            (unitQuery, centerUnit, env) =>
                unitQuery.withinSpacesOf(centerUnit, spacesNode.evaluate(env), false)
        );
        return clone;
    }

    /**
     * @param {NumberResolvable} rows
     * @return {this}
     */
    rows(rows) {
        let clone = this.clone();
        const rowsNode = NumberNode.toNumberNode(rows);
        clone._filters.push(
            (unitQuery, centerUnit, env) =>
                unitQuery.withinRowsOf(centerUnit, rowsNode.evaluate(env), false)
        );
        return clone;
    }

    /**
     * @param {NumberResolvable} columns
     * @return {this}
     */
    columns(columns) {
        let clone = this.clone();
        const rowsNode = NumberNode.toNumberNode(columns);
        clone._filters.push(
            (unitQuery, centerUnit, env) =>
                unitQuery.withinColumnsOf(centerUnit, rowsNode.evaluate(env), false)
        );
        return clone;
    }

    /**
     * @param {NumberResolvable} rows
     * @param {NumberResolvable} columns
     * @return {this}
     */
    rowsOrColumns(rows, columns = rows) {
        let clone = this.clone();
        const rowsNode = NumberNode.toNumberNode(rows);
        const columnsNode = NumberNode.toNumberNode(columns);
        clone._filters.push(
            (unitQuery, centerUnit, env) =>
                unitQuery.withinRowsOrColumnsOf(
                    centerUnit, rowsNode.evaluate(env), columnsNode.evaluate(env), false
                )
        );
        return clone;
    }

    /**
     * @return {this}
     */
    allies() {
        let clone = this.clone();
        clone._filters.push(
            (unitQuery, centerUnit, env) => unitQuery.sameGroup(UNIT.evaluate(env))
        );
        return clone;
    }

    /**
     * @return {this}
     */
    unitAndAllies() {
        let clone = this.clone();
        clone._filters.push(
            (unitQuery, centerUnit, env) => unitQuery.andSameGroup(UNIT.evaluate(env))
        );
        return clone;
    }

    /**
     * @return {this}
     */
    foes() {
        let clone = this.clone();
        clone._filters.push(
            (unitQuery, centerUnit, env) => unitQuery.differentGroup(UNIT.evaluate(env))
        );
        return clone;
    }

    /**
     * @param {TargetUnitNode} units
     * @return {this}
     */
    of(units) {
        const clone = this.clone();
        clone._centerNode = UnitsNode.toUnitsNode(units);
        return clone;
    }

    /**
     * @param {TargetUnitNode} units
     * @return {this}
     */
    centeredOn(units) {
        return this.of(units);
    }

    evaluate(env) {
        /** @type {Set<Unit>} */
        let unitSet = new Set();
        for (const centerUnit of this._centerNode.evaluate(env)) {
            let unitQuery = env.getUnitQuery().onMap();
            for (const filter of this._filters) {
                unitQuery = filter(unitQuery, centerUnit, env);
            }
            unitSet = SetUtil.union(unitSet, unitQuery.toSet());
        }
        return unitSet;
    }
}

// ※ andAlliesの理由: 範囲内にいるユニットは自分(UNIT)も含む可能性があるので最初のフィルタリングの段階でUNITを入れなければならない
// (例) ALLIES_WITHIN.spaces(1).of(ALLIES_WITHIN.spaces(1).of(UNIT))
const ALLIES_WITHIN = new UnitsWithinNode().unitAndAllies();

const FOES_WITHIN = new UnitsWithinNode().foes();

const CLOSEST_FOES = UNIT.closestFoes();

/**
 * @param {string} key
 * @param {SkillEffectField.Op} op
 * @param {string} message
 * @param {(unitName: string, operand: any) => string} messageFunc
 * @return {[GetSkillEffectFieldNode, (arg: SkillEffectFieldType) => SkillEffectFieldNode]}
 */
function makeUnitFieldOperators(key, op, message, messageFunc = null) {
    // 共通の設定処理を行う関数
    const setup = (node) =>
        node.setKey(key)
            .setLogMessage(message)
            .setLogMessageFunc(messageFunc);

    return [
        setup(new GetSkillEffectFieldNode()),
        operand => setup(new ModSkillEffectFieldNode(operand, op)),
    ];
}

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
        args.forEach(arg => {
            if (arg instanceof SkillEffectNode) arg.addParent(this);
        });
    }

    setDebug() {
        this._debug = true;
        return this;
    }

    onEvaluate(unit, env) {
        const args = this._getArgs(this._args, env);
        if (this._debug) {
            env.debug(this._messageBuilder(unit, ...args));
        } else {
            env.info(this._messageBuilder(unit, ...args));
        }
        return this._actionFunc(unit, ...args);
    }

    _getArgs(args, env) {
        if (args.length === 1 && args[0] instanceof SkillEffectNode) {
            return args[0].evaluate(env);
        }
        return args;
    }
}

/*
 * 実装
 */

const [
    BONUS_DURING_COMBAT,
    GRANTS_BONUS_DURING_COMBAT,
] = makeUnitFieldOperators(
    Unit.nameOf(unit => unit.spurs),
    SkillEffectField.Op.ARRAY_ADD,
    `攻撃/速さ/守備/魔防+`
);

const GRANTS_BONUS_ON_MAP = statsNode => CALL_UNIT_FUNC(
    (unit, ...stats) => unit.reserveToApplyBuffs(...stats),
    (unit, ...stats) => `${unit.nameWithGroup}にバフ予約: [${stats}]`,
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

const [
    PENALTY_DURING_COMBAT,
    INFLICTS_PENALTY_DURING_COMBAT,
] = makeUnitFieldOperators(
    Unit.nameOf(unit => unit.spurs),
    SkillEffectField.Op.ARRAY_SUB,
    `攻撃/速さ/守備/魔防-`
);

const INFLICTS_PENALTY_ON_MAP = statsNode => CALL_UNIT_FUNC(
    (unit, ...stats) => unit.reserveToApplyDebuffs(...stats.map(n => -n)),
    (unit, ...stats) => `${unit.nameWithGroup}にデバフ予約: [${stats}]`,
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

const [
    ,
    NEUTRALIZES_N_PENALTY_EFFECTS,
] = makeUnitFieldOperators(
    (Unit.nameOf(unit => unit.reservedNegativeStatusEffectCountInOrder)),
    SkillEffectField.Op.ADD,
    '',
    (name, n) => `${name}は戦闘中、不利な状態を上位${n}個解除`,
);

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

const RE_ENABLES_CANTO = CALL_UNIT_FUNC(
    (unit) => unit.reEnablesCantoOnMap(),
    (unit) => `${unit.nameWithGroup}は再移動を再発動可能になる`,
);

const CANTO_HAS_ALREADY_BEEN_TRIGGERED =
    new GetSkillEffectFieldNode()
        .setKey(Unit.nameOf(unit => unit.isCantoActivatedInCurrentTurn))
        .setLogMessage('再移動を発動済みか');

const MOVE_TYPE = new GetSkillEffectFieldNode()
    .setKey(Unit.nameOf(unit => unit.moveType))
    .setLogMessageFunc((name, n) => `${name}の移動タイプ: ${n}`);

const WEAPON_TYPE = new GetSkillEffectFieldNode()
    .setKey(Unit.nameOf(unit => unit.weaponType))
    .setLogMessageFunc((name, n) => `${name}の武器タイプ: ${n}`);

/**
 * 射程
 * @type {SkillEffectFieldNode}
 */
const RANGE = new GetSkillEffectFieldNode()
    .setKey(Unit.nameOf(unit => unit.attackRange))
    .setLogMessageFunc((name, n) => `${name}の射程: ${n}`);

const ON_MAP = CALL_UNIT_FUNC(
    (unit) => unit.isOnMap,
    (unit) => `${unit.nameWithGroup}はマップ上にいるか`,
).setDebug();

class GeneralGrantsAnotherActionNode extends SingleEffectNode {
    constructor() {
        super();
    }

    onEvaluate(unit, env) {
        if (env.assistTargeting === unit) {
            env.trace(`${env.assistTargeting.nameWithGroup}は自分を行動可能な状態にする（補助時再行動）`);
            unit.grantsAnotherActionOnAssist(true);
        }
    }
}

const GRANTS_ANOTHER_ACTION = new GeneralGrantsAnotherActionNode();
