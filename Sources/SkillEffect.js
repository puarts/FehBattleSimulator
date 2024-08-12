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
     * @param {number|NumberNode} numberOrNode
     * @returns {ConstantNumberNode|NumberNode}
     */
    static makeNumberNodeFrom(numberOrNode) {
        return typeof numberOrNode === 'number' ? new ConstantNumberNode(numberOrNode) : numberOrNode;
    }

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

class GTNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left > right;
    }
}

class GTENode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left >= right;
    }
}

class LTNode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left < right;
    }
}

class LTENode extends CompareNode {
    evaluate(env) {
        let [left, right] = this.evaluateChildren(env);
        return left <= right;
    }
}

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
        if (this.#condNode.evaluate(env)) {
            return super.evaluate(env);
        }
    }
}

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
        let index = this.#condNode.evaluate(env) ? 0 : 1;
        return this.getChildren()[index].evaluate(env);
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

class DamageCalculatorEnv {
    /**
     * @param {DamageCalculator} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     */
    constructor(damageCalculator, targetUnit, enemyUnit) {
        this.damageCalculator = damageCalculator;
        this.targetUnit = targetUnit;
        this.enemyUnit = enemyUnit;
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

class ForAlliesEnv {
    /**
     * @param {DamageCalculatorWrapper} damageCalculator
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {Unit} allyUnit
     */
    constructor(damageCalculator, targetUnit, enemyUnit, allyUnit) {
        this.damageCalculator = damageCalculator;
        this.targetUnit = targetUnit;
        this.enemyUnit = enemyUnit;
        this.allyUnit = allyUnit;
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
     * @param {DamageCalculatorWrapperEnv} env
     */
    evaluate(env) {
        return env.damageCalculator.unitManager.isThereAllyInCrossOf(env.targetUnit, Math.trunc(this.#n / 2));
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
     * @param {DamageCalculatorWrapperEnv} env
     */
    evaluate(env) {
        return env.damageCalculator.unitManager.countEnemiesInCrossWithOffset(env.targetUnit, Math.trunc(this.#n / 2));
    }
}

const NUM_OF_FOES_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE = new NumOfFoesWithinNRowsOrNColumnsCenteredOnUnitNode(3);

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
     * @param {DamageCalculatorWrapperEnv} env
     */
    evaluate(env) {
        let tiles =
            env.damageCalculator.map.enumerateTilesWithinSpecifiedDistance(env.targetUnit.placedTile, this._distance);
        return GeneratorUtil.some(tiles, this._pred);
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
    #n;

    /**
     * @param {number} n
     */
    constructor(n) {
        super();
        this.#n = n;
    }

    /**
     * @param {ForAlliesEnv} env
     */
    evaluate(env) {
        return env.allyUnit.isInCrossWithOffset(env.targetUnit, this.#n / 2);
    }
}

const IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE = new IsAllyWithinNRowsOrNColumnsCenteredOnUnitNode(3);

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

const HAS_UNIT_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE = new class extends BoolNode {
    evaluate(env) {
        return env.targetUnit.isCombatDone;
    }
}();

class PercentageCondNode extends BoolNode {
    _percentage;

    constructor(percentage) {
        super();
        this._percentage = percentage;
    }

}

class IsHpGTENPercentAtStartOfTurnNode extends PercentageCondNode {
    evaluate(env) {
        return env.targetUnit.restHpPercentageAtBeginningOfTurn >= this._percentage;
    }
}

const IS_HP_GTE_25_PERCENT_AT_START_OF_TURN_NODE = new IsHpGTENPercentAtStartOfTurnNode(25);

class IsHpGTENPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        return env.targetUnit.battleContext.restHpPercentage >= this._percentage;
    }
}

const IS_HP_GTE_25_PERCENT_AT_START_OF_COMBAT_NODE = new IsHpGTENPercentAtStartOfCombatNode(25);

class IsHpLTENPercentInCombatNode extends PercentageCondNode {
    evaluate(env) {
        // env.targetUnit.battleContext.restHpPercentage ではなくこちらが正しい
        return env.targetUnit.restHpPercentage <= this._percentage;
    }
}

const IS_HP_LTE_99_PERCENT_IN_COMBAT_NODE = new IsHpLTENPercentInCombatNode(99);

class IsFoesHpGTENPercentAtStartOfCombatNode extends PercentageCondNode {
    evaluate(env) {
        return env.enemyUnit.battleContext.restHpPercentage >= this._percentage;
    }
}

const IS_FOES_HP_GTE_50_PERCENT_AT_START_OF_COMBAT_NODE = new IsFoesHpGTENPercentAtStartOfCombatNode(50);
const IS_FOES_HP_GTE_75_PERCENT_AT_START_OF_COMBAT_NODE = new IsFoesHpGTENPercentAtStartOfCombatNode(75);

const CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE = new class extends BoolNode {
    evaluate(env) {
        return env.targetUnit.hasNormalAttackSpecial();
    }
}();

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

const GRANTING_BONUS_TO_ALL_4_NODE = new GrantingBonusToAllNode(4);
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

const GRANTING_BONUS_TO_ATK_SPD_4_NODE = new GrantingBonusToAtkSpdNode(4);
const GRANTING_BONUS_TO_ATK_SPD_5_NODE = new GrantingBonusToAtkSpdNode(5);
const GRANTING_BONUS_TO_ATK_SPD_6_NODE = new GrantingBonusToAtkSpdNode(6);
const GRANTING_BONUS_TO_ATK_SPD_7_NODE = new GrantingBonusToAtkSpdNode(7);

class NeutralizingFoesBonusesToStatus extends SkillEffectNode {
    /**
     * @param {boolean|BoolNode} atk
     * @param {boolean|BoolNode} spd
     * @param {boolean|BoolNode} def
     * @param {boolean|BoolNode} res
     */
    constructor(atk, spd, def, res) {
        super(...[atk, spd, def, res].map(b => BoolNode.makeBoolNodeFrom(b)));
    }

    evaluate(env) {
        env.targetUnit.battleContext.invalidateBuffs(...this.evaluateChildren(env));
    }
}

// 自分の最初の攻撃前に自身の奥義発動カウント-N(符号に注意Nは自然数)
class GrantingSpecialCooldownMinusNToUnitBeforeUnitsFirstAttackNode extends FromPositiveNumberNode {
    evaluate(env) {
        env.targetUnit.battleContext.specialCountReductionBeforeFirstAttack += this.evaluateChildren(env);
    }
}

const GRANTING_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_ATTACK_NODE =
    new GrantingSpecialCooldownMinusNToUnitBeforeUnitsFirstAttackNode(1);

// 自分の最初の追撃前に奥義発動カウント-N(符号に注意Nは自然数)
class GrantingSpecialCooldownMinusNToUnitBeforeUnitsFirstFollowUpAttackNode extends FromPositiveNumberNode {
    evaluate(env) {
        env.targetUnit.battleContext.specialCountReductionBeforeFollowupAttack += this.evaluateChildren(env);
    }
}

const FOE_CANNOT_COUNTERATTACK_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        env.targetUnit.battleContext.invalidatesCounterattack = true;
    }
}();

const GRANTING_SPECIAL_COOLDOWN_MINUS_1_TO_UNIT_BEFORE_UNITS_FIRST_FOLLOW_UP_ATTACK_NODE =
    new GrantingSpecialCooldownMinusNToUnitBeforeUnitsFirstFollowUpAttackNode(1);

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

class InCombatFoesEvalStatusNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        return env.enemyUnit.getStatusesInCombat(env.targetUnit)[this.#index];
    }
}

const IN_COMBAT_FOES_EVAL_ATK_NODE = new InCombatFoesEvalStatusNode(STATUS_INDEX.Atk);
const IN_COMBAT_FOES_EVAL_SPD_NODE = new InCombatFoesEvalStatusNode(STATUS_INDEX.Spd);
const IN_COMBAT_FOES_EVAL_DEF_NODE = new InCombatFoesEvalStatusNode(STATUS_INDEX.Def);
const IN_COMBAT_FOES_EVAL_RES_NODE = new InCombatFoesEvalStatusNode(STATUS_INDEX.Res);

class InCombatEvalStatusNode extends NumberNode {
    #index;

    constructor(index) {
        super();
        this.#index = index;
    }

    evaluate(env) {
        return env.targetUnit.getStatusesInCombat(env.enemyUnit)[this.#index];
    }
}

const IN_COMBAT_EVAL_ATK_NODE = new InCombatEvalStatusNode(STATUS_INDEX.Atk);
const IN_COMBAT_EVAL_SPD_NODE = new InCombatEvalStatusNode(STATUS_INDEX.Spd);
const IN_COMBAT_EVAL_DEF_NODE = new InCombatEvalStatusNode(STATUS_INDEX.Def);
const IN_COMBAT_EVAL_RES_NODE = new InCombatEvalStatusNode(STATUS_INDEX.Res);

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

class DealingDamagePerAttackNode extends ApplyNumericNode {
    evaluate(env) {
        env.targetUnit.battleContext.additionalDamageOfSpecialPerAttackInCombat += this.evaluateChildren(env);
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

class ApplyingSkillEffectsPerAttack extends SkillEffectNode {
    /**
     * @param {DamageCalculatorEnv} env
     */
    evaluate(env) {
        let node = new SkillEffectNode(...this.getChildren());
        env.targetUnit.battleContext.applySkillEffectPerAttackNodes.push(node);
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
const APPLY_SKILL_EFFECTS_FOR_UNIT_HOOKS = new SkillEffectHooks();

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

/**
 * 周囲に対する紋章効果
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const FOR_ALLIES_GRANTING_BONUS_HOOKS = new SkillEffectHooks();

/**
 * 周囲に対するスキル効果
 * @type {SkillEffectHooks<SkillEffectNode, ForAlliesEnv>} */
const FOR_ALLIES_APPLY_SKILL_EFFECTS_HOOKS = new SkillEffectHooks();
