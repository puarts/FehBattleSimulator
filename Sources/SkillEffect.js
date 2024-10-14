// Mixin
// TODO: 冗長なものはMixinを使用するようにする
const GetUnitMixin = {
    /**
     * @param {NodeEnv} env
     * @returns {Unit}
     */
    getUnit(env) {
        if (this._targetNode) {
            return this._targetNode.evaluate(env);
        }
        return env.target;
    },
};

const GetUnitDuringCombatMixin = {
    getUnit(env) {
        return env.unitDuringCombat;
    },
};

const GetFoeDuringCombatMixin = {
    getUnit(env) {
        return env.foeDuringCombat;
    },
};

const GetSkillOwnerCombatMixin = {
    getUnit(env) {
        return env.skillOwner;
    },
};

const GetAssistTargetsAllyMixin = {
    getUnit(env) {
        return env.getAssistAlly(env.target);
    },
}

const GetValueMixin = Object.assign({}, GetUnitMixin, {
    evaluate(env) {
        let unit = this.getUnit(env);
        let result = this.getValue(unit);
        env.debug(`${unit.nameWithGroup}${this.debugMessage}: ${result}`);
        return result;
    },
});

const CheckIfStatsDuringCombatAreDeterminedMixin = {
    checkIfStatsDuringCombatAreDetermined(env) {
        if (env.isStatusUnfixed) {
            env.error('Buffs and debuffs have not been applied yet');
        }
    }
};

const NSpacesMixin = {
    nSpaces: 0,
};

/**
 * @description getUnitsを実装すること
 */
const ForUnitMixin = {
    joinFunc: results => results.flat(1),
    evaluate(env) {
        let results = [];
        if (typeof this.getUnits !== 'function') {
            throw new Error("Class must implement 'getUnits'");
        }
        for (let unit of this.getUnits(env)) {
            env.debug(`${unit.nameWithGroup}を対象に選択`);
            let items = this.evaluateChildren(env.copy().setTarget(unit));
            results.push(items);
        }
        return this.joinFunc(results);
    }
};

/**
 * @abstract
 */
class UnitNode extends SkillEffectNode {
    /**
     * @param {NodeEnv} env
     * @returns {Unit}
     */
    evaluate(env) {
    }
}

class TargetNode extends UnitNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        return this.getUnit(env);
    }
}

const TARGET_NODE = new TargetNode();

const FOE_NODE = new class extends TargetNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

/**
 * @abstract
 */
class UnitsNode extends SkillEffectNode {
    /**
     * @param {UnitNode} unitNode
     * @returns {UnitsNode}
     */
    static makeFromUnit(unitNode) {
        return new class extends UnitsNode {
            evaluate(env) {
                return [unitNode.evaluate(env)];
            }
        };
    }

    /**
     * @param {NodeEnv} env
     * @returns {Iterable<Unit>}
     */
    evaluate(env) {
    }
}

class UniteUnitsNode extends UnitsNode {
    /**
     * @param {UnitsNode} unitsNode
     */
    constructor(...unitsNode) {
        super(...unitsNode);
    }

    evaluate(env) {
        return IterUtil.concat(...this.evaluateChildren(env).flat());
    }
}

class MapUnitsNode extends NumbersNode {
    /**
     * @param {UnitsNode} unitsNode
     * @param {NumberNode} funcNode
     */
    constructor(unitsNode, funcNode) {
        super();
        this._unitsNode = unitsNode;
        this._funcNode = funcNode;
    }

    evaluate(env) {
        let units = Array.from(this._unitsNode.evaluate(env));
        let values = units.map(u => this._funcNode.evaluate(env.copy().setTarget(u)));
        env.trace(`Map units: ${units.map(u => u.nameWithGroup)} => values: [${values}]`);
        return values;
    }
}

/**
 * @abstract
 */
class SpacesNode extends SkillEffectNode {
    /**
     * @abstract
     * @param {NodeEnv} env
     * @returns {Iterable<Tile>}
     */
    evaluate(env) {
    }
}

class UniteSpacesNode extends SpacesNode {
    /**
     * @param {...SpacesNode} children
     */
    constructor(...children) {
        super(...children);
    }

    /**
     * @param {NodeEnv} env
     * @returns {Iterable<Tile>}
     */
    evaluate(env) {
        return [...new Set(Array.from(IterUtil.concat(...this.evaluateChildren(env))))];
    }
}

class UniteSpacesIfNode extends SpacesNode {
    constructor(pred, ...children) {
        super(...children);
        this.predNode = BoolNode.makeBoolNodeFrom(pred);
    }

    /**
     * @param {NodeEnv} env
     * @returns {Iterable<Tile>}
     */
    evaluate(env) {
        if (this.predNode.evaluate(env)) {
            return [...new Set(Array.from(IterUtil.concat(...this.evaluateChildren(env))))];
        } else {
            return [];
        }
    }
}

class IsThereUnitOnMapNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(predNode, ...children) {
        super(...children);
        this._predNode = predNode;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let pred = u => u.isOnMap && this._predNode.evaluate(env.copy().setTarget(u));
        let result = env.unitManager.isThereUnit(pred);
        env.debug(`${unit.nameWithGroup}に対して条件を満たすユニットがマップ上にいるか: ${result}`);
        return result;
    }
}

const ARE_TARGET_AND_SKILL_OWNER_IN_SAME_GROUP_NODE = new class extends BoolNode {
    evaluate(env) {
        return env.target.groupId === env.skillOwner.groupId;
    }
}();

// TODO: リファクタリング
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

class NumOfTargetsAlliesWithinNSpacesNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} predNode
     */
    constructor(n, predNode = null) {
        super();
        this._n = NumberNode.makeNumberNodeFrom(n);
        this._predNode = predNode;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._n.evaluate(env);
        let pred = this._predNode ? u => this._predNode.evaluate(env.copy().setTarget(u)) : null;
        let result = env.unitManager.countAlliesWithinSpecifiedSpaces(unit, n, pred);
        env.debug(`${unit.nameWithGroup}の周囲${n}マスの味方の数: ${result}`);
        return result;
    }
}

// TODO: リファクタリング
class NumOfTargetsFoesWithinNSpacesOfTargetNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {UnitNode} targetNode
     */
    constructor(n, targetNode = null) {
        super();
        this._n = NumberNode.makeNumberNodeFrom(n);
        this._targetNode = targetNode;
    }

    evaluate(env) {
        let unit = this._targetNode ? this._targetNode.evaluate(env) : this.getUnit(env);
        let n = this._n.evaluate(env);
        let result = env.unitManager.countEnemiesWithinSpecifiedSpaces(unit, n);
        env.debug(`${unit.nameWithGroup}の周囲${n}マスの敵の数: ${result}`);
        return result;
    }
}

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

// TODO: 条件を指定できるようにする
/**
 * TODO: rename
 * if unit is within 5 spaces of a foe
 */
class IfTargetIsWithinNSpacesOfFoe extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env)[0];
        let result = env.unitManager.isThereEnemyInSpecifiedSpaces(unit, n);
        env.debug(`${unit.nameWithGroup}の周囲${n}マスに敵がいるか: ${result}`);
        return result;
    }
}

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

// TODO: Aliasの方を利用する
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

class IfUnitOrFoeInitiatesCombatAfterMovingToADifferentSpaceNode extends BoolNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let foe = env.foeDuringCombat;
        let distance = Unit.calcAttackerMoveDistance(unit, foe);
        let result = distance > 0;
        env.debug(`${unit.nameWithGroup}と${foe.nameWithGroup}はどちらかが異なるマスに移動したか: ${result}`);
        return result;
    }
}

const IF_UNIT_OR_FOE_INITIATES_COMBAT_AFTER_MOVING_TO_A_DIFFERENT_SPACE_NODE = new IfUnitOrFoeInitiatesCombatAfterMovingToADifferentSpaceNode();

const NUMBER_OF_SPACES_FROM_START_POSITION_TO_END_POSITION_OF_WHOEVER_INITIATED_COMBAT = new class extends NumberNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let foe = env.foeDuringCombat;
        let result = Unit.calcAttackerMoveDistance(unit, foe);
        env.debug(`${unit.nameWithGroup}と${foe.nameWithGroup}の移動距離: ${result}`);
        return result;
    }
}();

/**
 * moving to a different space
 */
class NumOfTargetsMovingSpacesNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = Unit.calcMoveDistance(unit);
        env.debug(`${unit.nameWithGroup}の移動距離: ${result}`);
        return result;
    }
}

// 周囲のユニット

class CantoEnv extends NodeEnv {
    /**
     * @param {Unit} targetUnit
     */
    constructor(targetUnit) {
        super();
        this.setSkillOwner(targetUnit);
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

class BattleMapEnv extends NodeEnv {
    /**
     * @param {BattleMap} battleMap
     * @param {Unit} targetUnit
     */
    constructor(battleMap, targetUnit) {
        super();
        this.setBattleMap(battleMap).setSkillOwner(targetUnit).setTarget(targetUnit);
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

class CantoRemNode extends CalcMoveCountForCantoNode {
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

const CANTO_REM_PLUS_ONE_NODE = new CantoRemNode(1);

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
const CANTO_DIST_MAX_3_NODE = new CantoDistNode(0, 3);

/**
 * TODO: 他のCanto (X)が出てきたらリネームする
 * Enables [Canto (X)] . If unit's Range = 1, X = 3; otherwise, X = 2.
 */
class CantoXNode extends CalcMoveCountForCantoNode {
    /**
     * @returns {number}
     */
    evaluate(env) {
        let unit = env.target;
        let result = unit.attackRange === 1 ? 3 : 2;
        env.debug(`${unit.nameWithGroup}の再移動距離: ${result}`);
        return result;
    }
}

class EnablesTargetToUseCantoAssistOnTargetsAllyNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} cantoAssist
     * @param {number|NumberNode} cantoSupport
     * @param {number|NumberNode} range
     */
    constructor(cantoAssist, cantoSupport, range) {
        super();
        this.cantoAssistNode = NumberNode.makeNumberNodeFrom(cantoAssist);
        this.cantoSupport = NumberNode.makeNumberNodeFrom(cantoSupport);
        this.rangeNode = NumberNode.makeNumberNodeFrom(range);
    }

    evaluate(env) {
        let unit = env.target;
        let oldSupport = unit.cantoSupport;

        let assistType = this.cantoAssistNode.evaluate(env);
        let assistRange = this.rangeNode.evaluate(env);
        let support = this.cantoSupport.evaluate(env);
        let success = unit.trySetCantoAssist(assistType, assistRange, support);
        if (success) {
            env.debug(`${unit.nameWithGroup}は再移動補助を発動: type: ${assistType}, support: ${support}, range: ${assistRange}`);
        } else {
            env.debug(`${unit.nameWithGroup}は同系統効果複数発動、この効果は発動しない: old: ${oldSupport}, new: ${support}`);
        }
    }
}

/**
 * 【Bonus】is active on unit
 */
const IS_BONUS_ACTIVE_ON_UNIT_NODE = new class extends BoolNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let foe = env.foeDuringCombat;
        let result = unit.hasPositiveStatusEffect(foe);
        env.debug(`${unit.nameWithGroup}は有利な状態を受けているか: ${result}`);
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

const HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE = new class extends BoolNode {
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
 * target's attack can trigger foe's Special
 */
class CanTargetsAttackTriggerTargetsSpecialNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.hasNormalAttackSpecial();
        env.debug(`${unit.nameWithGroup}が攻撃時に発動する奥義を装備しているか: ${result}, 奥義: ${unit.specialInfo?.name}`);
        return result;
    }
}

/**
 * if unit has an area-of-effect Special equipped,
 */
class HasTargetAoeSpecialNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.hasPrecombatSpecial();
        env.debug(`${unit.nameWithGroup}は範囲奥義を装備しているか: ${result}, 奥義: ${unit.specialInfo?.name}`);
        return result;
    }
}

const CAN_UNITS_ATTACK_TRIGGER_SPECIAL_NODE = new class extends CanTargetsAttackTriggerTargetsSpecialNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}();

const CAN_FOES_ATTACK_TRIGGER_FOES_SPECIAL_NODE = new class extends CanTargetsAttackTriggerTargetsSpecialNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}();

/**
 * If foe's attack triggers unit's Special
 */
class CanTargetsFoesAttackTriggerTargetsSpecialNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.hasDefenseSpecial();
        env.debug(`${unit.nameWithGroup}が攻撃を受ける際に発動する奥義を装備しているか: ${result}, 奥義: ${unit.specialInfo?.name}`);
        return result;
    }
}

/**
 * TODO: FromNumberNodeに統合する
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

class FromPositiveStatsNode extends FromPositiveNumbersNode {
    /**
     * @param {number|NumberNode} atk
     * @param {number|NumberNode} spd
     * @param {number|NumberNode} def
     * @param {number|NumberNode} res
     */
    constructor(atk, spd, def, res) {
        super(atk, spd, def, res);
    }
}

// Grants Plus

class GrantsStatsPlusToTargetDuringCombatNode extends FromPositiveStatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let amounts = this.evaluateChildren(env);
        let unit = this.getUnit(env);
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...amounts);
        env.debug(`${unit.nameWithGroup}の攻撃/速さ/守備/魔防+[${amounts}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

class GrantsStatsPlusToUnitDuringCombatNode extends GrantsStatsPlusToTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

class GrantsStatsPlusToFoeDuringCombatNode extends GrantsStatsPlusToTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class GrantsAllStatsPlusNToTargetDuringCombatNode extends GrantsStatsPlusToTargetDuringCombatNode {
    constructor(n) {
        super(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE);
        this._n = NumberNode.makeNumberNodeFrom(n);
    }

    evaluate(env) {
        env.storeValue(this._n.evaluate(env));
        super.evaluate(env);
    }
}

class GrantsAllStatsPlusNToUnitDuringCombatNode extends GrantsAllStatsPlusNToTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const GRANTS_ALL_STATS_PLUS_4_TO_TARGET_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToTargetDuringCombatNode(4);
const GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToTargetDuringCombatNode(5);

const GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToUnitDuringCombatNode(4);
const GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToUnitDuringCombatNode(5);

const GRANTS_ATK_SPD_PLUS_4_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(4, 4, 0, 0)
const GRANTS_ATK_SPD_PLUS_5_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(5, 5, 0, 0)
const GRANTS_ATK_SPD_PLUS_6_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(6, 6, 0, 0)
const GRANTS_ATK_SPD_PLUS_7_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(7, 7, 0, 0)

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
     * @param {NodeEnv} env
     * @return {[number, number, number, number]}
     */
    evaluate(env) {
        let result = super.evaluate(env);
        env.trace(`各要素を評価: [${result}]`)
        return result;
    }
}

const STATS_NODE = (atk, spd, def, res) => StatsNode.makeStatsNodeFrom(atk, spd, def, res);

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

class InflictsStatsMinusOnTargetDuringCombatNode extends FromPositiveStatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let spurs = this.evaluateChildren(env);
        let unit = this.getUnit(env);
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...spurs.map(v => -v));
        env.debug(`${unit.nameWithGroup}は攻撃/速さ/守備/魔坊-[${spurs}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

class InflictsStatsMinusOnUnitDuringCombatNode extends InflictsStatsMinusOnTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

class InflictsStatsMinusOnFoeDuringCombatNode extends InflictsStatsMinusOnTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const INFLICTS_ALL_STATS_MINUS_4_ON_FOE_DURING_COMBAT_NODE = new InflictsStatsMinusOnFoeDuringCombatNode(4, 4, 4, 4);
const INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE = new InflictsStatsMinusOnFoeDuringCombatNode(5, 5, 5, 5);

class TargetsMaxHpNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.maxHpWithSkills;
        env.debug(`${unit.nameWithGroup}の最大HP: ${result}`);
        return result;
    }
}

class SkillOwnerMaxHpNode extends TargetsMaxHpNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerCombatMixin);
    }
}

/**
 * @abstract
 */
class GetStatNode extends NumberNode {
    statsDescription = "";

    /**
     * @param {number|NumberNode} index
     */
    constructor(index) {
        super(NumberNode.makeNumberNodeFrom(index));
    }

    /**
     * @abstract
     * @param {NodeEnv} env
     * @return {[number, number, number, number]}
     */
    getStats(env) {
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let stats = this.getStats(env);
        let index = this.evaluateChildren(env);
        if (index < 0 || 3 < index) {
            env.error(`Index out of bounds: ${index}`);
        }
        let stat = stats[index];
        env.debug(`${unit.nameWithGroup}の${this.statsDescription}のステータス: ${stat} ([${stats}][${index}])`);
        return stat;
    }
}

class TargetsStatsAtStartOfTurnNode extends GetStatNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    statsDescription = "開始時";

    getStats(env) {
        return this.getUnit(env).getStatusesInPrecombat();
    }
}

class UnitsStatsAtStartOfCombatNode extends GetStatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }

    statsDescription = "戦闘開始時";

    getStats(env) {
        return this.getUnit(env).getStatusesInPrecombat();
    }
}

class FoesStatsAtStartOfCombatNode extends UnitsStatsAtStartOfCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class UnitsEvalStatsAtStartOfCombatNode extends UnitsStatsAtStartOfCombatNode {
    statsDescription = "戦闘開始時の比較時";

    getStats(env) {
        return this.getUnit(env).getEvalStatusesInPrecombat();
    }
}

class FoesEvalStatsAtStartOfCombatNode extends UnitsEvalStatsAtStartOfCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_ATK_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Atk);
const UNITS_SPD_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const UNITS_DEF_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Def);
const UNITS_RES_AT_START_OF_COMBAT_NODE = new UnitsStatsAtStartOfCombatNode(STATUS_INDEX.Res);

const UNITS_EVAL_ATK_AT_START_OF_COMBAT_NODE = new UnitsEvalStatsAtStartOfCombatNode(STATUS_INDEX.Atk);
const UNITS_EVAL_SPD_AT_START_OF_COMBAT_NODE = new UnitsEvalStatsAtStartOfCombatNode(STATUS_INDEX.Spd);
const UNITS_EVAL_DEF_AT_START_OF_COMBAT_NODE = new UnitsEvalStatsAtStartOfCombatNode(STATUS_INDEX.Def);
const UNITS_EVAL_RES_AT_START_OF_COMBAT_NODE = new UnitsEvalStatsAtStartOfCombatNode(STATUS_INDEX.Res);

const FOES_EVAL_ATK_AT_START_OF_COMBAT_NODE = new FoesEvalStatsAtStartOfCombatNode(STATUS_INDEX.Atk);
const FOES_EVAL_SPD_AT_START_OF_COMBAT_NODE = new FoesEvalStatsAtStartOfCombatNode(STATUS_INDEX.Spd);
const FOES_EVAL_DEF_AT_START_OF_COMBAT_NODE = new FoesEvalStatsAtStartOfCombatNode(STATUS_INDEX.Def);
const FOES_EVAL_RES_AT_START_OF_COMBAT_NODE = new FoesEvalStatsAtStartOfCombatNode(STATUS_INDEX.Res);

class TargetsStatsDuringCombat extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin, CheckIfStatsDuringCombatAreDeterminedMixin);
    }

    constructor(index) {
        super();
        this._indexNode = NumberNode.makeNumberNodeFrom(index);
    }

    /**
     * @abstract
     */
    _statName = 'ステータス';

    /**
     * @abstract
     * @returns {[number, number, number, number]}
     */
    getStats(env) {
    }

    evaluate(env) {
        this.checkIfStatsDuringCombatAreDetermined(env);
        let stats = this.getStats(env);
        let index = this._indexNode.evaluate(env);
        let stat = stats[index];
        env.debug(`${this.getUnit(env).nameWithGroup}の${this._statName}: ${stat} ([${stats}][${index}])`);
        return stat;
    }
}

class UnitsStatsDuringCombat extends TargetsStatsDuringCombat {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }

    _statName = '戦闘中のステータス';

    getStats(env) {
        let unit = this.getUnit(env);
        return unit.getStatusesInCombat(env.getFoeDuringCombatOf(unit));
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_ATK_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Atk);
const UNITS_SPD_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const UNITS_DEF_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Def);
// noinspection JSUnusedGlobalSymbols
const UNITS_RES_DURING_COMBAT_NODE = new UnitsStatsDuringCombat(STATUS_INDEX.Res);

class FoesStatsDuringCombatNode extends UnitsStatsDuringCombat {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOES_ATK_DURING_COMBAT_NODE = new FoesStatsDuringCombatNode(STATUS_INDEX.Atk);
const FOES_DEF_DURING_COMBAT_NODE = new FoesStatsDuringCombatNode(STATUS_INDEX.Def);
const FOES_RES_DURING_COMBAT_NODE = new FoesStatsDuringCombatNode(STATUS_INDEX.Res);

class UnitsEvalStatsDuringCombatNode extends TargetsStatsDuringCombat {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }

    _statName = '戦闘中の比較時のステータス';

    getStats(env) {
        let unit = this.getUnit(env);
        return unit.getEvalStatusesInCombat(env.getFoeDuringCombatOf(unit));
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_EVAL_ATK_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Atk);
const UNITS_EVAL_SPD_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const UNITS_EVAL_DEF_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Def);
// noinspection JSUnusedGlobalSymbols
const UNITS_EVAL_RES_DURING_COMBAT_NODE = new UnitsEvalStatsDuringCombatNode(STATUS_INDEX.Res);

class FoesEvalStatsDuringCombatNode extends TargetsStatsDuringCombat {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }

    _statName = '戦闘中の比較時のステータス';

    getStats(env) {
        let unit = this.getUnit(env);
        return unit.getStatusesInCombat(env.getFoeDuringCombatOf(unit));
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
 * If unit has not used or been the target of an Assist skill during the current turn,
 */
class IfTargetHasNotUsedAssistDuringCurrentTurnNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は現在ターン中に補助を使用していないか";

    getValue(unit) {
        return !unit.isSupportDone;
    }
}

const IF_TARGET_HAS_NOT_USED_ASSIST_DURING_CURRENT_TURN_NODE = new IfTargetHasNotUsedAssistDuringCurrentTurnNode();

class IfTargetHasNotBeenTargetOfAssistDuringCurrentTurnNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は現在ターン中に補助を使用されていないか";

    getValue(unit) {
        return !unit.isSupportedDone;
    }
}

const IF_TARGET_HAS_NOT_BEEN_TARGET_OF_ASSIST_DURING_CURRENT_TURN_NODE = new IfTargetHasNotBeenTargetOfAssistDuringCurrentTurnNode();

const IF_UNITS_OR_FOES_SPECIAL_IS_READY_OR_UNITS_OR_FOES_SPECIAL_TRIGGERED_BEFORE_OR_DURING_COMBAT_NODE = new class extends BoolNode {
    evaluate(env) {
        let unit = env.unitDuringCombat;
        let foe = env.foeDuringCombat;
        let result = Unit.canActivateOrActivatedSpecialEither(unit, foe);
        env.debug(`${unit.nameWithGroup}または${foe.nameWithGroup}が奥義発動可能もしくは発動済みであるか: ${result}`);
        return result;
    }
}();

/**
 * when defending in Aether Raids
 */
const WHEN_DEFENDING_IN_AETHER_RAIDS_NODE = new class extends BoolNode {
    evaluate(env) {
        // TODO: 値を渡すようにする
        return g_appData.gameMode === GameMode.AetherRaid && env.skillOwner.groupId === UnitGroupType.Enemy;
    }
}();

const IS_NOT_SUMMONER_DUELS_MODE_NODE = new class extends BoolNode {
    evaluate(env) {
        let result = g_appData.gameMode !== GameMode.SummonerDuels;
        env.debug(`英雄決闘以外か: ${result}`);
        return result;
    }
}();

/**
 * If【Penalty】is active on foe,
 */
class IfPenaltyIsActiveOnFoeNode extends BoolNode {
    evaluate(env) {
        let foe = env.foeDuringCombat;
        let result = foe.hasNegativeStatusEffect()
        env.debug(`${foe.nameWithGroup}は不利な状態を受けているか: ${result}`);
        return result;
    }
}

const IF_PENALTY_IS_ACTIVE_ON_FOE_NODE = new IfPenaltyIsActiveOnFoeNode();

const NUM_OF_COMBAT_ON_CURRENT_TURN_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let result = g_appData?.globalBattleContext?.numOfCombatOnCurrentTurn ?? 0;
        env.debug(`現在のターンで行われた戦闘回数: ${result}`);
        return result;
    }
}();

/**
 * Target that has entered combat during the current turn.
 */
class HasTargetEnteredCombatDuringTheCurrentTurnNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isCombatDone;
        env.debug(`${unit.nameWithGroup}はこのターン戦闘を行ったか : ${result}`);
        return result;
    }
}

const CURRENT_TURN_NODE = new class extends NumberNode {
    evaluate(env) {
        return g_appData.globalBattleContext?.currentTurn ?? 0;
    }
}

const NUM_OF_SPACES_START_TO_END_OF_WHOEVER_INITIATED_COMBAT_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let result = Unit.calcAttackerMoveDistance(env.unitDuringCombat, env.foeDuringCombat);
        env.debug(`攻撃した側が動いた距離は${result}`);
        return result;
    }
}();

class TargetsSpecialCountAtStartOfTurnNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.statusEvalUnit.specialCount;
        env.debug(`${unit.nameWithGroup}のターン開始時の奥義発動カウント: ${result}`);
        return result;
    }
}

class TargetsMaxSpecialCountNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.maxSpecialCount;
        env.debug(`${unit.nameWithGroup}の奥義発動カウントの最大値: ${result}`);
        return result;
    }
}

class HasTargetStatusEffectNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let e = this.evaluateChildren(env)[0];
        let result = unit.hasStatusEffect(e);
        env.debug(`${unit.nameWithGroup}は${getStatusEffectName(e)}を持っているか: ${result}`);
        return result;
    }
}

class NumOfTargetsDragonflowersNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.dragonflower;
        env.debug(`${unit.nameWithGroup}の神竜の花の数: ${result}`);
        return result;
    }
}

class TargetsMoveTypeNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.moveType;
        env.debug(`${unit.nameWithGroup}の移動タイプ: ${result}`);
        return result;
    }
}

class TargetsRangeNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.attackRange;
        env.debug(`${unit.nameWithGroup}の射程: ${result}`);
        return result;
    }
}

class FoesRangeNode extends TargetsRangeNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class IsTargetBeastOrDragonTypeNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = isWeaponTypeBreathOrBeast(unit.weaponType);
        env.debug(`${unit.nameWithGroup}は竜もしくは獣であるか: ${result}`);
        return result;
    }
}

class IsTargetMeleeWeaponNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isMeleeWeaponType();
        env.debug(`${unit.nameWithGroup}は1距離の武器か: ${result}`);
        return result;
    }
}

class IsFoeMeleeWeaponNode extends IsTargetMeleeWeaponNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class IsTargetRangedWeaponNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isRangedWeaponType();
        env.debug(`${unit.nameWithGroup}は2距離の武器か: ${result}`);
        return result;
    }
}

class IsFoeRangedWeaponNode extends IsTargetRangedWeaponNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class IsTarget2SpacesFromTargetsFoeNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let spaces = unit.getActualAttackRange(foe);
        let result = spaces === 2;
        env.debug(`${unit.nameWithGroup}と${foe.nameWithGroup}の距離は2か: ${result}`);
        return result;
    }
}

class FoesMoveNode extends NumberNode {
    evaluate(env) {
        let unit = env.foeDuringCombat;
        return unit.moveType;
    }
}

const FOE_MOVE_NODE = new FoesMoveNode();

/**
 * When unit deals damage to 2 or more foes at the same time using a Special (including target; including foes dealt 0 damage),
 */
class DoesTargetDealDamageTo2OrMoreTargetsFoesAtTheSameTimeUsingSpecialNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.damageCountOfSpecialAtTheSameTime;
        env.debug(`${unit.nameWithGroup}は範囲奥義で2人以上に攻撃したか: ${result}人`);
        return result >= 2;
    }
}

/**
 * if unit triggers Savior
 */
class DoesTargetTriggerSaviorNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.battleContext.isSaviorActivated;
        env.debug(`${unit.nameWithGroup}は護り手を発動しているか: ${result}`);
        return result;
    }
}

/**
 * total penalties
 */
class TargetsTotalPenaltiesNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = -unit.getDebuffTotal(unit !== env.foeDuringCombat);
        env.debug(`${unit.nameWithGroup}の弱化の合計値は${result}`);
        return result;
    }
}

// Unit or BattleContextの値を参照 END

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

class GrantsStatusEffectToSkillOwnerNode extends GrantsStatusEffectsNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerCombatMixin);
    }
}

class InflictStatusEffects extends GrantsStatusEffectsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }
}

/**
 * inflicts【Penalty】effects active on unit
 */
class InflictsPenaltyEffectsActiveOnSkillOwner extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        let skillOwner = env.skillOwner;
        let negativeStatusEffects = skillOwner.getNegativeStatusEffects();
        let debuffs = skillOwner.getDebuffs();
        skillOwner.reservedDebuffFlagsToNeutralize = [true, true, true, true];
        skillOwner.reservedStatusEffectSetToNeutralize = new Set(negativeStatusEffects);
        unit.reserveToApplyDebuffs(...debuffs);
        unit.reserveToAddStatusEffects(...negativeStatusEffects);
        env.debug(`反射されるデバフ: [${debuffs}]`);
        env.debug(`反射される不利なステータス: [${negativeStatusEffects.map(e => getStatusEffectName(e))}]`);
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

class RestoreTargetHpNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        let hp = unit.hp;
        unit.heal(n);
        env.debug(`${unit.nameWithGroup}はHPが${n}回復: ${hp} => ${unit.hp}`);
    }
}

class ForEachNode extends SkillEffectNode {
}

class ForEachUnitNode extends ForEachNode {
    /**
     * @param {UnitsNode} unitsNode
     * @param {...SkillEffectNode} nodes
     */
    constructor(unitsNode, ...nodes) {
        super(...nodes);
        this._unitsNode = unitsNode;
    }

    evaluate(env) {
        let units = this._unitsNode.evaluate(env);
        for (let unit of units) {
            env.debug(`${unit.nameWithGroup}を対象に選択`);
            this.evaluateChildren(env.copy().setTarget(unit));
        }
    }
}

const FOR_EACH_UNIT_NODE = (unitsNode, ...nodes) => new ForEachUnitNode(unitsNode, ...nodes);

/**
 * foe on the enemy team with the lowest stat
 */
class TargetsFoesOnTheEnemyTeamWithLowestStatNode extends UnitsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(statusType) {
        super();
        this._statusType = NumberNode.makeNumberNodeFrom(statusType);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let index = this._statusType.evaluate(env);
        let units = env.unitManager.enumerateUnitsInDifferentGroupOnMap(unit);
        let enemies = IterUtil.minElements(units, u => u.getEvalStatusesInPrecombat(true)[index]);
        let statName = statusTypeToString(index);
        let stat = enemies[0]?.getEvalStatusesInPrecombat(true)[index] ?? '-';
        env.trace(`最も低い${statName}(${stat})を持つユニットを選択: ${enemies.map(u => u.nameWithGroup)}`);
        return enemies;
    }
}

class TargetAndAlliesWithinNSpacesNode extends UnitsNode {
    /**
     * @param {number|NumberNode} n
     * @param {UnitsNode} unitsNode
     */
    constructor(n, unitsNode) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._unitsNode = unitsNode;
    }

    evaluate(env) {
        let n = this._nNode.evaluate(env);
        let units = this._unitsNode.evaluate(env);
        let results = [];
        for (let unit of units) {
            env.trace2(`${unit.nameWithGroup}の周囲${n}マスの味方を選択`);
            let allies = env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, n, true);
            results.push(allies);
        }
        return IterUtil.concat(...results);
    }
}

class ForEachUnitOnMapNode extends ForEachNode {
    static {
        Object.assign(this.prototype, ForUnitMixin);
    }

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

class ForEachTargetsFoeWithinNSpacesOfTargetNode extends ForEachUnitOnMapNode {
    static {
        Object.assign(this.prototype, GetUnitMixin, NSpacesMixin);
    }

    constructor(n, predNode, ...children) {
        super(predNode, ...children);
        this.nSpaces = n;
    }

    getUnits(env) {
        let unit = this.getUnit(env);
        let results = GeneratorUtil.toArray(env.unitManager.enumerateUnitsInDifferentGroupWithinSpecifiedSpaces(unit, this.nSpaces));
        env.debug(`${unit.nameWithGroup}の周囲${this.nSpaces}の敵: ${results.map(u => u.nameWithGroup)}`);
        return results;
    }
}

class ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode extends ForEachUnitAndAllyNode {
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

class ForEachTargetAndTargetsAllyWithin2SpacesOfTargetNode extends ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode {
    constructor(predNode, ...children) {
        super(2, predNode, ...children);
    }
}

class ForEachTargetAndFoeWithinNSpacesOfTargetNode extends ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode {
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

// TODO: リファクタリング
class ForEachAllyWithHighestValueWithinNSpacesNode extends ForEachUnitOnMapNode {
    constructor(n, predNode, valueFuncNode, ...children) {
        super(predNode, ...children);
        this._numberNode = NumberNode.makeNumberNodeFrom(n);
        this._valueFuncNode = valueFuncNode;
    }

    getUnits(env) {
        let allies = env.unitManager.enumerateUnitsInTheSameGroupOnMap(env.target);
        let highestUnits = IterUtil.maxElements(allies, u => this._valueFuncNode.evaluate(env.copy().setTarget(u)));
        env.debug(`最も値が高いユニット: ${highestUnits.map(u => u.nameWithGroup)}`);
        return highestUnits;
    }
}

class ForEachClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode extends ForEachUnitOnMapNode {
    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} children
     */
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
    /**
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} children
     */
    constructor(predNode, ...children) {
        super(2, predNode, ...children);
    }
}

const FOR_EACH_CLOSEST_FOE_AND_ANY_FOE_WITHIN2_SPACES_OF_THOSE_FOES_NODE =
    (...children) => new ForEachClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode(TRUE_NODE, ...children);

/**
 * Target and target's allis within n spaces.
 */
class ForEachTargetAndTargetsAllysWithinNSpacesNode extends ForEachUnitAndAllyNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} children
     */
    constructor(n, predNode, ...children) {
        super(predNode, ...children)
        this._nNode = NumberWithUnitNode.makeNumberNodeFrom(n);
    }

    /**
     * @param {NodeEnv} env
     * @returns {Generator<Unit>|Unit[]}
     */
    getUnits(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        let pred = u => this._predNode.evaluate(env.copy().setTarget(u));
        return GeneratorUtil.filter(env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, n, true), pred);
    }
}

class ForEachUnitFromSameTitlesNode extends ForEachNode {
    static {
        Object.assign(this.prototype, GetUnitMixin, ForUnitMixin);
    }

    /**
     * @param {EnumerationEnv|NodeEnv} env
     */
    getUnits(env) {
        return env.unitManager.enumerateAlliesThatHaveSameOrigin(this.getUnit(env));
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

// Tileへの効果 START

/**
 * @abstract
 */
class IsInRangeNNode extends BoolNode {
    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} predNode
     */
    constructor(n, predNode) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._predNode = predNode;
    }
}

/**
 * If unit is within N spaces of an ally,
 */
class IsTargetWithinNSpacesOfTargetsAllyNode extends IsInRangeNNode {
    evaluate(env) {
        let spaces = this._nNode.evaluate(env);
        let result = env.unitManager.isThereAllyInSpecifiedSpaces(env.target, spaces, u => this._predNode.evaluate(env.copy().setTarget(u)));
        env.debug(`${env.target.nameWithGroup}の周囲${spaces}マスに条件を満たす味方が存在するか: ${result}`);
        return result;
    }
}

// noinspection JSUnusedGlobalSymbols
const IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE = new IsTargetWithinNSpacesOfTargetsAllyNode(2, TRUE_NODE);
const IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE = new IsTargetWithinNSpacesOfTargetsAllyNode(3, TRUE_NODE);

class IsUnitWithinNSpacesOfUnitsAllyNode extends IsTargetWithinNSpacesOfTargetsAllyNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

class IsTargetWithinNSpacesOfSkillOwnerNode extends IsInRangeNNode {
    evaluate(env) {
        let spaces = this._nNode.evaluate(env);
        let result = env.target.distance(env.skillOwner) <= spaces;
        env.debug(`${env.skillOwner.nameWithGroup}の周囲${spaces}マス以内に${env.target.nameWithGroup}がいるか: ${result}`);
        return result;
    }
}

// noinspection JSUnusedGlobalSymbols
const IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE = new IsTargetWithinNSpacesOfSkillOwnerNode(2, TRUE_NODE);
const IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE = new IsTargetWithinNSpacesOfSkillOwnerNode(3, TRUE_NODE);

class AreTargetAndSkillOwnerPartnersNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = env.skillOwner.isPartner(unit);
        env.debug(`${unit.nameWithGroup}は${env.skillOwner.nameWithGroup}と支援を結んでいるか: ${result}`);
        return result;
    }
}

/**
 * TODO: 動作確認する。
 * @abstract
 */
class ForTargetsOfTargetNode extends ForEachNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} procedureNodes
     */
    constructor(predNode, ...procedureNodes) {
        super(...procedureNodes);
        this._predNode = predNode;
    }

    /**
     * @abstract
     * @param {NodeEnv} env
     * @returns {Set<Unit>}
     */
    getUnitSet(env) {
    }

    evaluate(env) {
        for (let ally of this.getUnitSet(env)) {
            env.debug(`${ally.nameWithGroup}を対象に選択`);
            this.evaluateChildren(env.copy().setTarget(ally));
        }
    }
}

class ForTargetsAlliesOnMapNode extends ForTargetsOfTargetNode {
    /**
     * @param {BoolNode} predNode
     * @param {boolean|BoolNode} containsTarget
     * @param {...SkillEffectNode} procedureNodes
     */
    constructor(predNode, containsTarget, ...procedureNodes) {
        super(predNode, ...procedureNodes);
        this._containsTargetNode = BoolNode.makeBoolNodeFrom(containsTarget);
    }

    getUnitSet(env) {
        let unit = this.getUnit(env);
        let pred = u => this._predNode.evaluate(env.copy().setTarget(u));
        let allies = env.unitManager.enumerateUnitsInTheSameGroupOnMap(unit);
        let allySet = new Set(GeneratorUtil.filter(allies, pred));
        if (this._containsTargetNode.evaluate(env)) {
            allySet.add(unit);
        }
        return allySet;
    }
}

/**
 * @abstract
 */
class ForTargetsAlliesInNRangeOfTargetNode extends ForTargetsOfTargetNode {
    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} procedureNodes
     */
    constructor(n, predNode, ...procedureNodes) {
        super(predNode, ...procedureNodes);
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    getN(env) {
        return this._nNode.evaluate(env);
    }
}

/**
 * to allies within n spaces of unit
 */
class ForTargetsAlliesWithinNSpacesOfTargetNode extends ForTargetsAlliesInNRangeOfTargetNode {
    getUnitSet(env) {
        let unit = this.getUnit(env);
        let pred = u => this._predNode.evaluate(env.copy().setTarget(u));
        let n = this.getN(env);
        let allies = env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, n);
        return new Set(GeneratorUtil.filter(allies, pred));
    }
}

const FOR_TARGETS_ALLIES_WITHIN_3_SPACES_OF_TARGET_NODE =
    (...procedureNodes) => new ForTargetsAlliesWithinNSpacesOfTargetNode(3, TRUE_NODE, ...procedureNodes);

/**
 * applies【Divine Vein (Stone)】to unit's space and spaces within 2 spaces of unit for 1 turn.
 */
class AppliesDivineVeinNode extends SkillEffectNode {
    /**
     * TODO: 文字列を渡せるようにする
     * TODO: traceログを追加
     * @param {number} divineVein
     * @param {BoolNode} predNode
     * @param {number|BoolNode} turns
     */
    constructor(divineVein, predNode, turns = 1) {
        super(predNode);
        this._divineVein = divineVein;
        this._turns = NumberNode.makeNumberNodeFrom(turns);
    }

    getUnit(env) {
        return env.target;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        env.debug(`${unit.nameWithGroup}は天脈(${this._divineVein})を付与`);
        let turns = this._turns.evaluate(env) ?? 1;
        for (let tile of g_appData.map.enumerateTiles()) {
            let copyEnv = env.copy();
            copyEnv.tile = tile;
            if (this.evaluateChildren(copyEnv)[0]) {
                tile.reserveDivineVein(this._divineVein, unit.groupId, turns);
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

class IsSpacesNSpacesAwayFromTargetNode extends BoolNode {
    /**
     * TODO: traceログを追加
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let distance = env.tile.calculateDistance(env.target.placedTile);
        let n = this.evaluateChildren(env)[0];
        // TODO: 警告が出ないようにする
        // noinspection JSIncompatibleTypesComparison
        return distance === n;
    }
}

class IsSpacesNSpacesAwayFromAssistedNode extends BoolNode {
    /**
     * TODO: traceログを追加
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let distance = env.tile.calculateDistance(env.assistTarget.placedTile);
        let n = this.evaluateChildren(env)[0];
        // TODO: 警告が出ないようにする
        // noinspection JSIncompatibleTypesComparison
        return distance === n;
    }
}

class IsSpacesWithinNSpacesOfTargetNode extends BoolNode {
    constructor(n) {
        super(NumberNode.makeNumberNodeFrom(n));
    }

    evaluate(env) {
        let distance = env.tile.calculateDistance(env.assistTarget.placedTile);
        let n = this.evaluateChildren(env)[0];
        // TODO: 警告が出ないようにする
        // noinspection JSIncompatibleTypesComparison
        return distance <= n;
    }
}

// TODO: renameを検討
class IsNotSpaceOccupiedByTargetsFoeNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let placedUnit = env.tile.placedUnit;
        return !(placedUnit && placedUnit.groupId !== unit.groupId);
    }
}

const IS_SPACE_OCCUPIED_BY_TARGETS_FOE_NODE = new IsNotSpaceOccupiedByTargetsFoeNode();

const IS_NOT_DESTRUCTIBLE_TERRAIN_OTHER_THAN_DIVINE_VEIN_ICE_NODE = new class extends BoolNode {
    evaluate(env) {
        let unit = env.skillOwner;
        let tile = env.tile;
        if (tile.obj == null) {
            return true;
        }
        let obj = tile.obj;
        if (obj instanceof OffenceStructureBase || obj instanceof DefenceStructureBase) {
            if (obj.isBreakable) {
                return false;
            }
        }
        return true;
    }
}

class IsThereNoDivineVeinIceCurrentlyAppliedByTargetOrTargetsAlliesNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        /** @type {Unit} */
        let unit = this.getUnit(env);
        // TODO: envで渡すようにする
        let tiles = g_appData.map.enumerateTiles();
        for (let tile of tiles) {
            if (tile.divineVein === DivineVeinType.Ice &&
                tile.divineVeinGroup === unit.groupId) {
                env.debug(`天脈・氷がすでに存在: ${tile}`);
                return false;
            }
        }
        env.debug(`天脈・氷が存在しない`);
        return true;
    }
}

const IS_THERE_NO_DIVINE_VEIN_ICE_CURRENTLY_APPLIED_BY_TARGET_OR_TARGETS_ALLIES_NODE =
    new IsThereNoDivineVeinIceCurrentlyAppliedByTargetOrTargetsAlliesNode();

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

/**
 * TODO: 汎用的にする
 * Applies【Divine Vein (Ice)】to unit's space and spaces within 2 spaces of unit for 2 turns
 */
class AppliesDivineVeinIceToTargetsSpaceAndSpacesWithinNSpacesOfTargetFor2TurnsNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        for (let tile of g_appData.map.enumerateTilesWithinSpecifiedDistance(unit.placedTile, n)) {
            let obj = tile.obj;
            if (obj instanceof OffenceStructureBase || obj instanceof DefenceStructureBase) {
                if (obj.isBreakable) {
                    continue;
                }
            }
            let placedUnit = tile.placedUnit;
            if (placedUnit && !placedUnit.isSameGroup(unit)) {
                continue;
            }
            tile.reserveDivineVein(DivineVeinType.Ice, unit.groupId, 2);
        }
        g_appData.map.applyReservedDivineVein();
    }
}

// Tileへの効果 END

// Tileを返す START
class ForEachTargetForSpacesNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin, ForUnitMixin);
    }

    /**
     * @param {BoolNode} predNode
     * @param {...SpacesNode} children
     */
    constructor(predNode, ...children) {
        super(...children);
        this._predNode = predNode;
        this.joinFunc = unitEvaluations => IterUtil.concat(...unitEvaluations.flat());
    }
}

class ForEachAllyForSpacesNode extends ForEachTargetForSpacesNode {
    getUnits(env) {
        let units = env.battleMap.enumerateUnitsInTheSameGroup(this.getUnit(env));
        return GeneratorUtil.filter(units, u => this._predNode.evaluate(env.copy().setTarget(u)));
    }
}

class SpacesWithinNSpacesNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     */
    constructor(n) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    /**
     * @param {NodeEnv} env
     * @returns {Iterable<Tile>}
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        env.debug(`${env.skillOwner.nameWithGroup}は${unit.nameWithGroup}の周囲${n}マスに移動可能`);
        return env.battleMap.__enumeratePlacableTilesWithinSpecifiedSpaces(unit.placedTile, env.skillOwner, n);
    }
}

class OverrideAoeSpacesNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let targetTile = env.tile;
        let xt = targetTile.posX;
        let yt = targetTile.posY;
        let xu = unit.placedTile.posX;
        let yu = unit.placedTile.posY;
        // 爆風範囲(3x3)の中心
        let xc = xt;
        let yc = yt;

        // 位置関係によって中心を計算する
        if (xt > xu) {
            xc++;
        }
        if (xt < xu) {
            xc--;
        }
        if (yt > yu) {
            yc++;
        }
        if (yt < yu) {
            yc--;
        }

        // 爆風範囲内か判定
        let isInRange = tile => tile.isInRange(xc - 1, xc + 1, yc - 1, yc + 1);
        return env.battleMap.enumerateTiles(isInRange);
    }
}

// Tileを返す END

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

class InflictsStatsMinusAfterCombatNode extends InflictsStatsMinusAtStartOfTurnNode {
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

class InflictsStatusEffectsAtStartOfTurnNode extends GrantsStatusEffectsAtStartOfTurnNode {
}

class InflictsStatusEffectsAfterCombatNode extends GrantsStatusEffectsAfterCombatNode {
}

// TODO: rename
class ReservesToGrantStatusEffectsToTargetNode extends FromNumbersNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {...number} values
     */
    constructor(...values) {
        super(...values);
    }

    evaluate(env) {
        this.evaluateChildren(env).forEach(e => {
            let unit = this.getUnit(env);
            env.debug(`${unit.nameWithGroup}に${getStatusEffectName(e)}を付与予約`);
            unit.reserveToAddStatusEffect(e);
        });
    }
}

class ReservesToGrantStatusEffectsToAssistAllyNode extends ReservesToGrantStatusEffectsToTargetNode {
    static {
        Object.assign(this.prototype, GetAssistTargetsAllyMixin);
    }
}

class GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        // TODO: battleContextに設定するように修正するか検討する
        unit.reserveToReduceSpecialCount(n);
        env.debug(`${unit.nameWithGroup}は奥義発動カウント-${n}を予約`);
        return super.evaluate(env);
    }
}

class GrantsSpecialCooldownCountMinusOnTargetOnMapNode extends GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode {
}

class GrantsSpecialCooldownCountMinusOnTargetAfterCombatNode extends GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode {
}

// TODO: rename
// skill text: grants Special cooldown count-1
class GrantsSpecialCooldownCountMinusOnTargetNode extends GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode {
}

/**
 * inflicts Special cooldown count+1
 */
class InflictsSpecialCooldownCountPlusNOnTargetAtStartOfTurnNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.reserveToIncreaseSpecialCount(n);
        env.debug(`${unit.nameWithGroup}は奥義発動カウント+${n}を予約`);
        return super.evaluate(env);
    }
}

class InflictsSpecialCooldownCountPlusNOnTargetAfterCombat extends InflictsSpecialCooldownCountPlusNOnTargetAtStartOfTurnNode {
}

/**
 * deals 1 damage to unit and those allies.
 */
class DealsDamageToTargetAtStartOfTurnNode extends FromPositiveNumberNode {
    evaluate(env) {
        let unit = env.target;
        let result = this.evaluateChildren(env);
        unit.reservedDamage += result;
        env.debug(`${unit.nameWithGroup}は${result}ダメージを予約`);
    }
}

// 再行動・再移動
class GrantsAnotherActionNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let success = unit.grantAnotherActionOnAssistIfPossible();
        if (success) {
            env.debug(`${unit.nameWithGroup}は再行動`);
        } else {
            env.debug(`${unit.nameWithGroup}は再行動を発動できない(発動済み)`);
        }
    }
}

class GrantsAnotherActionOnAssistNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let success = unit.grantAnotherActionOnAssistIfPossible();
        if (success) {
            env.debug(`${unit.nameWithGroup}は再行動`);
        } else {
            env.debug(`${unit.nameWithGroup}は再行動を発動できない(発動済み)`);
        }
    }
}

class GrantsAnotherActionAndInflictsIsolationNode extends SkillEffectNode {
    evaluate(env) {
        let unit = this.getUnit(env);
        env.trace(`${unit.nameWithGroup}の${this.getPhase()}の再行動判定を開始`);
        if (unit.isActionDone) {
            env.trace(`${unit.nameWithGroup}は行動を終了している`);
            if (!this.hasGrantedAnotherAction(unit)) {
                env.trace(`${unit.nameWithGroup}はこのターン再行動を発動していない`);
                this.setHasGrantedAnotherAction(unit);
                env.trace(`${unit.nameWithGroup}の再行動を設定`);
                unit.grantsAnotherAction();
                env.debug(`${unit.nameWithGroup}は再行動`);
                unit.addStatusEffect(StatusEffectType.Isolation);
                env.debug(`${unit.nameWithGroup}は自分とダブル相手に${getStatusEffectName(StatusEffectType.Isolation)}を付与`);
            } else {
                env.trace(`${unit.nameWithGroup}はこのターン再行動を発動している`);
            }
        } else {
            env.trace(`${unit.nameWithGroup}は行動を終了していない`);
        }
    }
}

class GrantsAnotherActionAndInflictsIsolationAfterTargetInitiatedCombatNode extends GrantsAnotherActionAndInflictsIsolationNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    getPhase() {
        return "戦闘後";
    }

    setHasGrantedAnotherAction(unit) {
        unit.hasGrantedAnotherActionAfterCombatInitiation = true;
    }

    hasGrantedAnotherAction(unit) {
        return unit.hasGrantedAnotherActionAfterCombatInitiation;
    }
}

const GRANTS_ANOTHER_ACTION_AND_INFLICTS_ISOLATION_AFTER_TARGET_INITIATED_COMBAT_NODE =
    new GrantsAnotherActionAndInflictsIsolationAfterTargetInitiatedCombatNode()

class GrantsAnotherActionAndInflictsIsolationAfterActionWithoutCombatNode extends GrantsAnotherActionAndInflictsIsolationNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    getPhase() {
        return "戦闘以外の行動後";
    }

    setHasGrantedAnotherAction(unit) {
        unit.hasGrantedAnotherActionAfterActionWithoutCombat = true;
    }

    hasGrantedAnotherAction(unit) {
        return unit.hasGrantedAnotherActionAfterActionWithoutCombat;
    }
}

const GRANTS_ANOTHER_ACTION_AND_INFLICTS_ISOLATION_AFTER_ACTION_WITHOUT_COMBAT_NODE =
    new GrantsAnotherActionAndInflictsIsolationAfterActionWithoutCombatNode()

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

/**
 * if Special cooldown count is at its maximum value
 */
class IsTargetsSpecialCooldownCountIsAtItsMaximumNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let isMax = unit.isSpecialCountMax;
        env.debug(`${unit.nameWithGroup}の奥義発動カウントが最大かどうか: ${isMax}, count: ${unit.specialCount}/${unit.maxSpecialCount}`);
        return isMax;
    }
}

class IsTargetTransformedNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isTransformed;
        env.debug(`${unit.nameWithGroup}は化身しているか: ${result}`);
        return result;
    }
}

class IsDifferentOriginNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.hasDifferentTitle(env.skillOwner);
        env.debug(`${unit.nameWithGroup}は${env.skillOwner.nameWithGroup}と異なる出典を持つか: ${result}}`);
        return result;
    }
}

class CalcPotentialDamageNode extends BoolNode {
    evaluate(env) {
        let result = env.calcPotentialDamage;
        env.trace(`calcPotentialDamage: ${result}`);
        return result;
    }
}

function getSkillLogLevel() {
    if (typeof g_appData === 'undefined') {
        return LoggerBase.LOG_LEVEL.OFF;
    }
    return g_appData?.skillLogLevel ?? LoggerBase.LOG_LEVEL.OFF;
}