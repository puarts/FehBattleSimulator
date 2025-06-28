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

const GetSkillOwnerMixin = {
    getUnit(env) {
        return env.skillOwner;
    },
};

const GetAssistTargetsAllyMixin = {
    getUnit(env) {
        return env.getAssistAlly(env.target);
    },
}

const GetAssistTargetingMixin = {
    getUnit(env) {
        return env.assistTargeting;
    },
}

const GetAssistTargetMixin = {
    getUnit(env) {
        return env.assistTarget;
    },
}

const GetValueMixin = Object.assign({}, GetUnitMixin, {
    evaluate(env) {
        let unit = this.getUnit(env);
        let result = this.getValue(unit, env);
        env.debug(`${unit.nameWithGroup}${this.debugMessage}: ${result}`);
        return result;
    },
});

const GetTargetTileMixin = {
    getTile(env) {
        return env.tile;
    },
}

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

class DebugEnvNode extends SkillEffectNode {
    evaluate(env) {
        console.log('env: %o', env);
    }
}

const DEBUG_ENV_NODE = new DebugEnvNode();

class PrintDebugNode extends SkillEffectNode {
    constructor(message) {
        super();
        this._message = message;
    }

    evaluate(env) {
        console.log(`debug message: ${this._message}`);
    }
}

const PRINT_DEBUG_NODE = message => new PrintDebugNode(message);

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
}();

const SKILL_OWNER_NODE = new class extends TargetNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}();

class AssistTargetingNode extends TargetNode {
    static {
        Object.assign(this.prototype, GetAssistTargetingMixin);
    }
}

const ASSIST_TARGETING_NODE = new AssistTargetingNode();

class AssistTargetNode extends TargetNode {
    static {
        Object.assign(this.prototype, GetAssistTargetMixin);
    }
}

const ASSIST_TARGET_NODE = new AssistTargetNode();

/**
 * @abstract
 */
class UnitsNode extends SkillEffectNode {
    /**
     * @param {UnitNode|UnitsNode} unitNode
     * @returns {UnitsNode}
     */
    static makeFromUnit(unitNode) {
        if (unitNode instanceof UnitNode) {
            return new class extends UnitsNode {
                evaluate(env) {
                    return [unitNode.evaluate(env)];
                }
            };
        } else {
            return unitNode;
        }
    }

    /**
     * @param {...UnitNode} units
     * @return {UnitsNode}
     */
    static makeFromUnits(...units) {
        return new class extends UnitsNode {
        }(...units);
    }

    /**
     * @param {NodeEnv} env
     * @returns {Iterable<Unit>}
     */
    evaluate(env) {
        return super.evaluate(env);
    }
}

class IncludesUnitNode extends BoolNode {
    /**
     * @param {UnitNode} unitNode
     * @param {UnitsNode} unitsNode
     */
    constructor(unitNode, unitsNode) {
        super();
        this._unitNode = unitNode;
        this._unitsNode = unitsNode;
    }

    evaluate(env) {
        let unit = this._unitNode.evaluate(env);
        let units = this._unitsNode.evaluate(env);
        return IterUtil.has(units, unit);
    }
}

const INCLUDES_UNIT_NODE = (unitNode, unitsNode) => new IncludesUnitNode(unitNode, unitsNode);

class UnitsOnMapNode extends UnitsNode {
    evaluate(env) {
        if (env.unitManager) {
            return env.unitManager.enumerateAllUnitsOnMap();
        } else if (env.battleMap) {
            return env.battleMap.enumerateUnitsOnMap();
        }
        return [];
    }
}

class TargetsAlliesOnMapNode extends UnitsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {BoolNode} includesTarget
     */
    constructor(includesTarget = FALSE_NODE) {
        super();
        this._includesTargetNode = includesTarget;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let withTargetUnit = this._includesTargetNode.evaluate(env);
        if (env.unitManager) {
            return env.unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
        } else if (env.battleMap) {
            return env.battleMap.enumerateUnitsInTheSameGroup(unit, withTargetUnit);
        }
        return [];
    }
}

const TARGETS_ALLIES_WITHOUT_TARGET_ON_MAP_NODE = new TargetsAlliesOnMapNode();
const TARGET_AND_TARGETS_ALLIES_ON_MAP_NODE = new TargetsAlliesOnMapNode(TRUE_NODE);

class FoesAlliesOnMapNode extends TargetsAlliesOnMapNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOE_AND_FOES_ALLIES_ON_MAP_NODE = new FoesAlliesOnMapNode(TRUE_NODE);

class TargetsFoesOnMapNode extends UnitsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor() {
        super();
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        return env.unitManager.enumerateUnitsInDifferentGroupOnMap(unit);
    }
}

const TARGETS_FOES_ON_MAP_NODE = new TargetsFoesOnMapNode();

class TargetsAlliesWithinNSpacesNode extends UnitsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} includesTarget
     */
    constructor(n, includesTarget = FALSE_NODE) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._includesTargetNode = includesTarget;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let spaces = this._nNode.evaluate(env);
        let withTargetUnit = this._includesTargetNode.evaluate(env);
        let result = env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, spaces, withTargetUnit);
        let allies = Array.from(result);
        env.debug(`${unit.nameWithGroup}の周囲${spaces}マスの味方: ${allies.map(u => u.nameWithGroup).join(', ')}`);
        return allies;
    }
}

const TARGETS_ALLIES_WITHIN_N_SPACES_NODE = (n, includesTarget = FALSE_NODE) => new TargetsAlliesWithinNSpacesNode(n, includesTarget);
const TARGETS_ALLIES_WITHIN_2_SPACES_NODE = (includesTarget = FALSE_NODE) => new TargetsAlliesWithinNSpacesNode(2, includesTarget);

class FoesAlliesWithinNSpacesNode extends TargetsAlliesWithinNSpacesNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOES_ALLIES_WITHIN_N_SPACES_NODE = (n, includesTarget = FALSE_NODE) => new FoesAlliesWithinNSpacesNode(n, includesTarget);

class AssistTargetsAlliesWithinNSpacesOfTargetNode extends TargetsAlliesWithinNSpacesNode {
    static {
        Object.assign(this.prototype, GetAssistTargetsAllyMixin);
    }
}

const ASSIST_TARGETS_ALLIES_WITHIN_N_SPACES_OF_TARGET_NODE =
    (n, includesTarget) => new AssistTargetsAlliesWithinNSpacesOfTargetNode(n, includesTarget);
const ASSIST_TARGETS_ALLIES_WITHIN_2_SPACES_OF_TARGET_NODE =
    includesTarget => ASSIST_TARGETS_ALLIES_WITHIN_N_SPACES_OF_TARGET_NODE(2, includesTarget);

class TargetsClosestFoesNode extends UnitsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let enemies = env.unitManager.enumerateUnitsInDifferentGroupOnMap(unit);
        return IterUtil.minElements(enemies, u => u.distance(unit));
    }
}

class TargetsClosestFoesWithinNSpacesNode extends UnitsNode {
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
        let enemies = env.unitManager.enumerateUnitsInDifferentGroupOnMap(unit);
        let n = this._nNode.evaluate(env);
        return IterUtil.filter(
            IterUtil.minElements(enemies, u => u.distance(unit)),
            u => u.distance(unit) <= n
        );
    }
}

class TargetsClosestAlliesWithinNSpacesNode extends UnitsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} includesTarget
     * @param {BoolNode} predNode
     */
    constructor(n, includesTarget = FALSE_NODE, predNode = TRUE_NODE) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._includesTargetNode = includesTarget;
        this._predNode = predNode;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let withTargetUnit = this._includesTargetNode.evaluate(env);
        let allies = env.unitManager.enumerateUnitsInTheSameGroupOnMap(unit, withTargetUnit);
        allies = IterUtil.filter(allies, u => this._predNode.evaluate(env.copy().setTarget(u)));
        let n = this._nNode.evaluate(env);
        return IterUtil.filter(
            IterUtil.minElements(allies, u => u.distance(unit)),
            u => u.distance(unit) <= n
        );
    }
}

class FoesClosestAlliesWithinNSpacesNode extends TargetsClosestAlliesWithinNSpacesNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOES_CLOSEST_ALLIES_WITHIN_N_SPACES_NODE = (n, includesTargetNode, predNode) =>
    new FoesClosestAlliesWithinNSpacesNode(n, includesTargetNode, predNode);

class MaxUnitsNode extends UnitsNode {
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
        let maxUnits = IterUtil.maxElements(units, u => this._funcNode.evaluate(env.copy().setTarget(u)));
        env.trace(`Max units: ${maxUnits.map(u => u.nameWithGroup)}`);
        return maxUnits;
    }
}

class MinUnitsNode extends UnitsNode {
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
        let minUnits = IterUtil.minElements(units, u => this._funcNode.evaluate(env.copy().setTarget(u)));
        env.trace(`Min units: ${minUnits.map(u => u.nameWithGroup)}`);
        return minUnits;
    }
}

class UniteUnitsNode extends UnitsNode {
    /**
     * @param {...(UnitNode|UnitsNode)} unitsNode
     */
    constructor(...unitsNode) {
        let units = unitsNode.map(
            node => node instanceof UnitNode ? UniteUnitsNode.makeFromUnit(node) : node
        );
        super(...units);
    }

    evaluate(env) {
        return IterUtil.concat(...this.evaluateChildren(env));
    }
}

const UNITE_UNITS_NODE = (...unitsNode) => new UniteUnitsNode(...unitsNode);

/**
 * @template T
 */
class MapUnionUnitsNode extends SkillEffectNode {
    /**
     * @param {UnitsNode} unitsNode
     * @param {SetNode<T>} funcNode
     */
    constructor(unitsNode, funcNode) {
        super();
        this._unitsNode = unitsNode;
        this._funcNode = funcNode;
    }

    /**
     * @param env
     * @returns {Set<T>}
     */
    evaluate(env) {
        let units = Array.from(this._unitsNode.evaluate(env));
        let values = units.map(u => this._funcNode.evaluate(env.copy().setTarget(u)));
        env.trace(`Map units: ${units.map(u => u.nameWithGroup)} => values: [${values.map(s => SetUtil.toString(s))}]`);
        let result = SetUtil.union(...values);
        env.trace(`Union set: ${SetUtil.toString(result)}`);
        return result;
    }
}

const MAP_UNION_UNITS_NODE = (unitsNode, funcNode) => new MapUnionUnitsNode(unitsNode, funcNode);

class MapUnitsToNumNode extends NumbersNode {
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

const MAP_UNITS_TO_NUM_NODE = (unitsNode, funcNode) => new MapUnitsToNumNode(unitsNode, funcNode);

class FilterUnitsNode extends UnitsNode {
    /**
     * @param {UnitsNode} unitsNode
     * @param {BoolNode} predNode
     */
    constructor(unitsNode, predNode) {
        super();
        this._unitsNode = unitsNode;
        this._predNode = predNode;
    }

    evaluate(env) {
        let units = this._unitsNode.evaluate(env);
        return IterUtil.filter(units, u => this._predNode.evaluate(env.copy().setTarget(u)));
    }
}

const FILTER_UNITS_NODE = (unitsNode, predNode) => new FilterUnitsNode(unitsNode, predNode);

class CountUnitsNode extends PositiveNumberNode {
    /**
     * @param {UnitsNode} unitsNode
     */
    constructor(unitsNode) {
        super();
        this._unitsNode = unitsNode;
    }

    evaluate(env) {
        let units = Array.from(this._unitsNode.evaluate(env));
        let result = units.length;
        env.debug(`ユニットの数: ${result}`);
        return result;
    }
}

const COUNT_UNITS_NODE = unitsNode => new CountUnitsNode(unitsNode);

class CountIfUnitsNode extends PositiveNumberNode {
    /**
     * @param {UnitsNode} unitsNode
     * @param {BoolNode} predNode
     */
    constructor(unitsNode, predNode) {
        super();
        this._unitsNode = unitsNode;
        this._predNode = predNode;
    }

    evaluate(env) {
        let units = Array.from(this._unitsNode.evaluate(env));
        units = units.filter(u => this._predNode.evaluate(env.copy().setTarget(u)));
        let result = units.length;
        env.debug(`ユニットの数: ${result}`);
        return result;
    }
}

const COUNT_IF_UNITS_NODE = (unitsNode, predNode) => new CountIfUnitsNode(unitsNode, predNode);

const EXISTS_UNITS = (units, pred) => GT_NODE(COUNT_UNITS_NODE(FILTER_UNITS_NODE(units, pred)), 0);

/**
 * ターゲットを補助ユニット、補助を受けるユニットにそれぞれ設定して引数のUnitsNodeを評価する
 */
class UnitsOfBothAssistTargetingAndAssistTargetNode extends UnitsNode {
    /**
     * @param {UnitsNode} unitsNode
     */
    constructor(unitsNode) {
        super();
        this._unitsNode = unitsNode;
    }

    evaluate(env) {
        let targetAndAlliesNode = this._unitsNode;
        return IterUtil.unique(IterUtil.concat(
            targetAndAlliesNode.evaluate(env.copy().setTarget(env.assistTargeting)),
            targetAndAlliesNode.evaluate(env.copy().setTarget(env.assistTarget)),
        ));
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

class NoSpacesNode extends SpacesNode {
    evaluate(env) {
        return [];
    }
}

const NO_SPACES_NODE = new NoSpacesNode();

class SpacesIfNode extends SpacesNode {
    /**
     * @param {boolean|BoolNode} pred
     * @param {SpacesNode} spacesNode
     */
    constructor(pred, spacesNode) {
        super();
        this._pred = BoolNode.makeBoolNodeFrom(pred);
        this._spacesNode = spacesNode;
    }

    evaluate(env) {
        if (this._pred.evaluate(env)) {
            return this._spacesNode.evaluate(env);
        } else {
            return [];
        }
    }
}

const SPACES_IF_NODE = (pred, spacesNode) => new SpacesIfNode(pred, spacesNode);

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

const UNITE_SPACES_NODE = (...children) => new UniteSpacesNode(...children);

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

const UNITE_SPACES_IF_NODE = (pred, ...children) => new UniteSpacesIfNode(pred, ...children);

class IntersectSpacesNode extends SpacesNode {
    constructor(...children) {
        super(...children);
    }

    evaluate(env) {
        return SetUtil.intersection(...this.evaluateChildren(env).map(s => new Set(s)));
    }
}

class FilterSpacesNode extends SpacesNode {
    /**
     * @param {SpacesNode} spacesNode
     * @param {BoolNode} predNode
     */
    constructor(spacesNode, predNode) {
        super();
        this._spacesNode = spacesNode;
        this._predNode = predNode;
    }

    evaluate(env) {
        let spaces = Array.from(this._spacesNode.evaluate(env));
        let spacesStr = spaces.map(s => s.positionToString()).join(', ');
        let filteredSpaces = spaces.filter(s => this._predNode.evaluate(env.copy().setTile(s)));
        let filteredSpacesStr = filteredSpaces.map(s => s.positionToString()).join(', ');
        env.trace(`${spacesStr}をフィルタリング: ${filteredSpacesStr}`);
        return filteredSpaces;
    }
}

const FILTER_SPACES_NODE = (n, predNode) => new FilterSpacesNode(n, predNode);

class CountSpacesNode extends PositiveNumberNode {
    constructor(spacesNode) {
        super();
        this._spacesNode = spacesNode;
    }

    evaluate(env) {
        let spaces = Array.from(this._spacesNode.evaluate(env));
        let result = spaces.length;
        env.trace(`マスの数: ${result}`);
        return result;
    }
}

const COUNT_SPACES_NODE = spacesNode => new CountSpacesNode(spacesNode);

const IS_THERE_SPACES = (spaces, pred) =>
    GT_NODE(
        COUNT_SPACES_NODE(
            FILTER_SPACES_NODE(
                spaces,
                pred)),
        0,
    );

class SpacesOnMapNode extends SpacesNode {
    constructor(predNode) {
        super();
        this._predNode = predNode;
    }

    evaluate(env) {
        let map = env.battleMap;
        return IterUtil.filter(map.enumerateTiles(), t => this._predNode.evaluate(env.copy().setTile(t)));
    }
}

const SPACES_ON_MAP_NODE = (predNode) => new SpacesOnMapNode(predNode);

class SpacesWithinNSpacesOfTargetNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        let result = env.battleMap.enumerateTilesWithinSpecifiedDistance(unit.placedTile, n);
        env.trace(`Spaces within ${n} spaces of ${unit.nameWithGroup}`);
        return result;
    }
}

const SPACES_WITHIN_N_SPACES_OF_TARGET_NODE = n => new SpacesWithinNSpacesOfTargetNode(n);

class SpacesWithinNSpacesOfSkillOwnerNode extends SpacesWithinNSpacesOfTargetNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const SPACES_WITHIN_N_SPACES_OF_SKILL_OWNER_NODE = n => new SpacesWithinNSpacesOfSkillOwnerNode(n);

class SpacesWithinNSpacesOfFoeNode extends SpacesWithinNSpacesOfTargetNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const SPACES_WITHIN_N_SPACES_OF_FOE_NODE = n => new SpacesWithinNSpacesOfFoeNode(n);

class SpacesOfTargetNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(predNode) {
        super();
        this._predNode = predNode;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let tileSet = new Set();
        for (let tile of env.battleMap.enumerateTiles()) {
            if (!tileSet.has(tile) &&
                this._predNode.evaluate(env.copy().setTarget(unit).setTile(tile))) {
                tileSet.add(tile);
            }
        }
        return tileSet;
    }
}

const SPACES_OF_TARGET_NODE = (predNode) => new SpacesOfTargetNode(predNode);

class TargetsPlacedSpaceNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let tile = unit.placedTile;
        env.debug(`${unit.nameWithGroup}の配置されているマス: ${tile}`);
        return [tile];
    }
}

const TARGETS_PLACED_SPACE_NODE = new TargetsPlacedSpaceNode();

class PlacedSpacesNode extends SpacesNode {
    /**
     * @param {UnitsNode} unitsNode
     */
    constructor(unitsNode) {
        super();
        this._unitsNode = unitsNode;
    }

    evaluate(env) {
        let units = this._unitsNode.evaluate(env);
        return IterUtil.map(units, u => u.placedTile);
    }
}

const PLACED_SPACES_NODE = unitsNode => new PlacedSpacesNode(unitsNode);

class SpacesWithinNSpacesOfSpacesNode extends SpacesNode {
    /**
     * @param {number|NumberNode} n
     * @param {SpacesNode} spacesNode
     */
    constructor(n, spacesNode) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._spacesNode = spacesNode;
    }

    evaluate(env) {
        let n = this._nNode.evaluate(env);
        let targetTiles = Array.from(this._spacesNode.evaluate(env));
        let tileSet = new Set();
        for (let targetTile of targetTiles) {
            let tmpTiles = [];
            for (let tile of env.battleMap.enumerateTilesWithinSpecifiedDistance(targetTile, n)) {
                tileSet.add(tile);
                tmpTiles.push(tile);
            }
            let tilesStr = tmpTiles.map(t => t.positionToString()).join(', ');
            env.trace(`${targetTile.positionToString()}の周囲${n}マス以内のマス: ${tilesStr}`);
        }
        let targetTilesStr = targetTiles.map(t => t.positionToString()).join(', ');
        let resultTilesStr = Array.from(tileSet, t => t.positionToString()).join(', ');
        env.trace(`${targetTilesStr}の周囲${n}マス以内のマス${resultTilesStr}`);
        return tileSet;
    }
}

const SPACES_WITHIN_N_SPACES_OF_SPACES_NODE =
    (n, spacesNode) => new SpacesWithinNSpacesOfSpacesNode(n, spacesNode);

class SkillOwnersPlacedSpaceNode extends TargetsPlacedSpaceNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const SKILL_OWNERS_PLACED_SPACE_NODE = new SkillOwnersPlacedSpaceNode();

class IsThereTargetsAllyOnTargetSpace extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin, GetTargetTileMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let tile = this.getTile(env);
        let unitOnTile = tile.placedUnit;
        if (unitOnTile && unit.isSameGroup(unitOnTile) && unit !== unitOnTile) {
            env.debug(`${tile.positionToString()}に味方ユニットがいる: ${unitOnTile.nameWithGroup}`);
            return true;
        } else {
            env.debug(`${tile.positionToString()}に味方ユニットがいない`);
            return false;
        }
    }
}

class IsThereSkillOwnersAllyOnTargetSpaceNode extends IsThereTargetsAllyOnTargetSpace {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const IS_THERE_SKILL_OWNERS_ALLY_ON_TARGET_SPACE_NODE =
    new IsThereSkillOwnersAllyOnTargetSpaceNode();

class IsThereDivineVeinEffectAppliedOnTargetSpacesNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetTargetTileMixin);
    }

    evaluate(env) {
        let tile = this.getTile(env);
        let result = tile.isDivineVeinApplied();
        env.debug(`${tile.positionToString()}に天脈が付与されているか: ${result}`);
        return result;
    }
}

const IS_THERE_DIVINE_VEIN_EFFECT_APPLIED_ON_TARGET_SPACES_NODE = new IsThereDivineVeinEffectAppliedOnTargetSpacesNode();

class IsTargetSpaceDefensiveTerrainNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetTargetTileMixin);
    }

    evaluate(env) {
        let tile = this.getTile(env);
        let result = tile.isDefensiveTile;
        env.debug(`${tile.positionToString()}は防御地形か: ${result}`);
        return result;
    }
}

const IS_TARGET_SPACE_DEFENSIVE_TERRAIN_NODE = new IsTargetSpaceDefensiveTerrainNode();

class DoesTargetSpaceCountAsDifficultTerrainExcludingImpassableTerrainNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetTargetTileMixin);
    }

    evaluate(env) {
        let tile = this.getTile(env);
        let result = tile.doesCountsAsDifficultTerrainExcludingImpassableTerrain();
        env.debug(`${tile.positionToString()}はいずれかの移動タイプが侵入可能で平地のように移動できない地形か: ${result}`);
        return result;
    }
}

const DOES_TARGET_SPACE_COUNT_AS_DIFFICULT_TERRAIN_EXCLUDING_IMPASSABLE_TERRAIN_NODE =
    new DoesTargetSpaceCountAsDifficultTerrainExcludingImpassableTerrainNode();

class HasTargetSpaceTrapNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetTargetTileMixin);
    }

    evaluate(env) {
        let tile = this.getTile(env);
        let result = tile.obj instanceof TrapBase;
        env.debug(`${tile}に罠があるか: ${result}`);
        return result;
    }
}

const HAS_TARGET_SPACE_TRAP_NODE = new HasTargetSpaceTrapNode();

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
        let result = false;
        if (env.unitManager) {
            result = env.unitManager.isThereUnit(pred);
        } else if (env.battleMap) {
            for (let unit of env.battleMap.enumerateUnitsOnMap()) {
                if (pred(unit)) {
                    result = true;
                    break;
                }
            }
        }
        env.debug(`${unit.nameWithGroup}に対して条件を満たすユニットがマップ上にいるか: ${result}`);
        return result;
    }
}

const IS_THERE_UNIT_ON_MAP_NODE = (predNode, ...children) => new IsThereUnitOnMapNode(predNode, ...children);

class TargetGroupNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.groupId;
        env.debug(`${unit.nameWithGroup}は${groupIdToString(result)}軍`);
        return result;
    }
}

const TARGET_GROUP_NODE = new TargetGroupNode();

/**
 * ターゲットとスキル所有者が同じ場合はfalse
 */
const ARE_TARGET_AND_SKILL_OWNER_IN_SAME_GROUP_NODE = new class extends BoolNode {
    evaluate(env) {
        return env.target.groupId === env.skillOwner.groupId && env.target !== env.skillOwner;
    }
}();

const ARE_TARGET_AND_SKILL_OWNER_IN_DIFFERENT_GROUP_NODE = new class extends BoolNode {
    evaluate(env) {
        return env.target.groupId !== env.skillOwner.groupId;
    }
}();

const ARE_TARGET_AND_ASSIST_UNIT_IN_SAME_GROUP_NODE = new class extends BoolNode {
    evaluate(env) {
        return env.target.groupId === env.assistTargeting.groupId;
    }
}();

const ARE_TARGET_AND_SKILL_OWNER_PARTNERS_NODE = new class extends BoolNode {
    evaluate(env) {
        let result = env.target.isPartner(env.skillOwner) && env.target.isSameGroup(env.skillOwner);
        env.debug(`${env.target.nameWithGroup}と${env.skillOwner.nameWithGroup}は支援を結んでいるか: ${result}`);
        return result;
    }
}();

class AreTargetAndAssistTargetingInSameGroupNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let targeting = env.assistTargeting;
        let result = unit.isSameGroup(targeting);
        env.debug(`${unit.nameWithGroup}と${targeting.nameWithGroup}は同じ軍であるか: ${result}`);
        return result;
    }
}

const ARE_TARGET_AND_ASSIST_TARGETING_IN_SAME_GROUP_NODE = new AreTargetAndAssistTargetingInSameGroupNode();

class AreSkillOwnerAndAssistTargetingInSameGroupNode extends AreTargetAndAssistTargetingInSameGroupNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }
}

const ARE_SKILL_OWNER_AND_ASSIST_TARGETING_IN_SAME_GROUP_NODE = new AreSkillOwnerAndAssistTargetingInSameGroupNode();

class IsThereTargetsAllyOnMapNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(predNode) {
        super();
        this._predNode = predNode;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let allies = env.unitManager.enumerateUnitsInTheSameGroupOnMap(unit);
        for (let ally of allies) {
            if (this._predNode.evaluate(env.copy().setTarget(ally))) {
                env.debug(`${ally.nameWithGroup}は条件を満たす`);
                return true;
            }
        }
        env.debug('条件を満たす味方は存在しない');
        return false;
    }
}

const IS_THERE_TARGETS_ALLY_ON_MAP_NODE = (predNode) => new IsThereTargetsAllyOnMapNode(predNode);

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

const NUM_OF_TARGETS_ALLIES_WITHIN_1_SPACES_NODE = new NumOfTargetsAlliesWithinNSpacesNode(1);
const NUM_OF_TARGETS_ALLIES_WITHIN_2_SPACES_NODE = new NumOfTargetsAlliesWithinNSpacesNode(2);
const NUM_OF_TARGETS_ALLIES_WITHIN_3_SPACES_NODE = new NumOfTargetsAlliesWithinNSpacesNode(3);
const NUM_OF_TARGETS_ALLIES_NODE = pred => new NumOfTargetsAlliesWithinNSpacesNode(99, pred);

class NumOfFoesAlliesWithinNSpacesNode extends NumOfTargetsAlliesWithinNSpacesNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
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

const NUM_OF_TARGETS_FOES_WITHIN_3_SPACES_OF_TARGET_NODE = new NumOfTargetsFoesWithinNSpacesOfTargetNode(3);

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

// TODO: 削除
const IS_ALLY_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_UNIT_NODE = new IsAllyWithinNRowsOrNColumnsCenteredOnUnitNode(3);

class IsTargetsFoeInCardinalDirectionsOfTargetNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        for (let ally of env.unitManager.enumerateUnitsInDifferentGroupOnMap(unit)) {
            if (ally.isInCrossOf(unit)) {
                env.debug(`${unit.nameWithGroup}の十字方向に敵がいる: ${ally.nameWithGroup}`);
                return true;
            }
        }
        env.debug(`${unit.nameWithGroup}の十字方向に敵がいない`);
        return false;
    }
}

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
        this.setBattleMap(handler.map);
        this.setSkillOwner(targetUnit);
        this.setTarget(targetUnit);
    }
}

class AfterCombatEnv extends NodeEnv {
    /**
     * @param {PostCombatSkillHander} handler
     * @param {Unit} targetUnit
     * @param {Unit} enemyUnit
     * @param {BattleMap} battleMap
     */
    constructor(handler, targetUnit, enemyUnit, battleMap) {
        super();
        this.phase = NodeEnv.PHASE.AFTER_COMBAT;
        this.setPostCombatHandler(handler);
        this.setUnitsFromTargetAndEnemyUnit(targetUnit, enemyUnit);
        this.setBattleMap(battleMap);
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
const CANTO_DIST_PLUS_2_MAX_5_NODE = new CantoDistNode(2, 5);
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

const ENABLES_TARGET_TO_USE_CANTO_ASSIST_ON_TARGETS_ALLY_NODE =
    (cantoAssist, cantoSupport, range) =>
        new EnablesTargetToUseCantoAssistOnTargetsAllyNode(cantoAssist, cantoSupport, range);

class IsBonusActiveOnTargetNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let result = unit.hasPositiveStatusEffect(foe);
        env.debug(`${unit.nameWithGroup}は有利な状態を受けているか: ${result}`);
        return result;
    }
}

const IS_BONUS_ACTIVE_ON_TARGET_NODE = new IsBonusActiveOnTargetNode();

/**
 * 【Bonus】is active on unit
 */
const IS_BONUS_ACTIVE_ON_UNIT_NODE = new class extends IsBonusActiveOnTargetNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}();


const IS_BONUS_ACTIVE_ON_FOE_NODE = new class extends IsBonusActiveOnTargetNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}();

/**
 * 【StatusEffect】is active on target
 */
class IsStatusEffectActiveOnTargetNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} value
     */
    constructor(value) {
        super(NumberNode.makeNumberNodeFrom(value));
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let statusEffect = this.evaluateChildren(env)[0];
        let result = unit.hasStatusEffect(statusEffect);
        env.debug(`${unit.nameWithGroup}が${getStatusEffectName(statusEffect)}を持っているか: ${result}`);
        return result;
    }
}

const IS_STATUS_EFFECT_ACTIVE_ON_TARGET_NODE = e => new IsStatusEffectActiveOnTargetNode(e);

/**
 * 【StatusEffect】is active on unit
 */
class IsStatusEffectActiveOnUnitNode extends IsStatusEffectActiveOnTargetNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const IS_STATUS_EFFECT_ACTIVE_ON_UNIT_NODE = e => new IsStatusEffectActiveOnUnitNode(e);

class HasTargetEnteredCombatDuringCurrentTurnNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {BattleSimulatorBaseEnv|NodeEnv} env
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isCombatDone;
        env.debug(`${unit.nameWithGroup}が現在ターン中に自分が戦闘を行なっているか: ${result}`);
        return result;
    }
}

const HAS_TARGET_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE = new HasTargetEnteredCombatDuringCurrentTurnNode();

class HasFoeEnteredCombatDuringCurrentTurnNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const HAS_FOE_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE = new HasFoeEnteredCombatDuringCurrentTurnNode();

class HasSkillOwnerEnteredCombatDuringCurrentTurnNode extends HasTargetEnteredCombatDuringCurrentTurnNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const HAS_SKILL_OWNER_ENTERED_COMBAT_DURING_CURRENT_TURN_NODE = new HasSkillOwnerEnteredCombatDuringCurrentTurnNode();

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

const CAN_TARGETS_ATTACK_TRIGGER_TARGETS_SPECIAL_NODE = new CanTargetsAttackTriggerTargetsSpecialNode();

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

const HAS_TARGET_AOE_SPECIAL_NODE = new HasTargetAoeSpecialNode();

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

const CAN_TARGETS_FOES_ATTACK_TRIGGER_TARGETS_SPECIAL_NODE = new CanTargetsFoesAttackTriggerTargetsSpecialNode();

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
     * @param {number|NumberNode|NumbersNode} atkOrStats
     * @param {number|NumberNode} spd
     * @param {number|NumberNode} def
     * @param {number|NumberNode} res
     */
    constructor(atkOrStats, spd = null, def = null, res = null) {
        super(atkOrStats, spd, def, res);
    }
}

// Grants Plus

class GrantsStatPlusToTargetDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n, statIndex) {
        super();
        this._n = NumberNode.makeNumberNodeFrom(n);
        this._statIndex = NumberNode.makeNumberNodeFrom(statIndex);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._n.evaluate(env);
        let index = this._statIndex.evaluate(env);
        let ratios = [0, 0, 0, 0];
        ratios[index] = 1;
        let beforeSpurs = unit.getSpurs();
        let spurs = ratios.map(r => r * n);
        env.debug(`${unit.nameWithGroup}は戦闘中、${getStatusName(index)}+${n}: [${beforeSpurs}] => [${unit.getSpurs()}]`);
        unit.addSpurs(...spurs);
    }
}

/**
 * @param {number|NumberNode} n
 * @param {number|NumberNode} index
 * @returns {SkillEffectNode}
 * @constructor
 */
const GRANTS_STAT_PLUS_TO_TARGET_DURING_COMBAT_NODE =
    (n, index) => new GrantsStatPlusToTargetDuringCombatNode(n, index);

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

const GRANTS_STATS_PLUS_TO_TARGET_DURING_COMBAT_NODE =
    (atk, spd, def, res) => new GrantsStatsPlusToTargetDuringCombatNode(atk, spd, def, res);

const GRANTS_ATK_TO_TARGET_DURING_COMBAT_NODE =
    n => GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(STATUS_INDEX.Atk, n);
const GRANTS_SPD_TO_TARGET_DURING_COMBAT_NODE =
    n => GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(STATUS_INDEX.Spd, n);
const GRANTS_DEF_TO_TARGET_DURING_COMBAT_NODE =
    n => GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(STATUS_INDEX.Def, n);
const GRANTS_RES_TO_TARGET_DURING_COMBAT_NODE =
    n => GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE(STATUS_INDEX.Res, n);

const GRANTS_ATK_SPD_TO_TARGET_DURING_COMBAT_NODE =
    (atk, spd = atk) => new GrantsStatsPlusToTargetDuringCombatNode(atk, spd, 0, 0);
const GRANTS_ATK_DEF_TO_TARGET_DURING_COMBAT_NODE =
    (atk, def = atk) => new GrantsStatsPlusToTargetDuringCombatNode(atk, 0, def, 0);
const GRANTS_ATK_RES_TO_TARGET_DURING_COMBAT_NODE =
    (atk, res = atk) => new GrantsStatsPlusToTargetDuringCombatNode(atk, 0, 0, res);
const GRANTS_SPD_DEF_TO_TARGET_DURING_COMBAT_NODE =
    (spd, def = spd) => new GrantsStatsPlusToTargetDuringCombatNode(0, spd, def, 0);
const GRANTS_DEF_RES_TO_TARGET_DURING_COMBAT_NODE =
    (def, res = def) => new GrantsStatsPlusToTargetDuringCombatNode(0, 0, def, res);

const GRANTS_ATK_SPD_DEF_TO_TARGET_DURING_COMBAT_NODE =
    (atk, spd = atk, def = atk) => new GrantsStatsPlusToTargetDuringCombatNode(atk, spd, def, 0);
const GRANTS_ATK_DEF_RES_TO_TARGET_DURING_COMBAT_NODE =
    (atk, def = atk, res = atk) => new GrantsStatsPlusToTargetDuringCombatNode(atk, 0, def, res);
const GRANTS_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE =
    (spd, def = spd, res = spd) => new GrantsStatsPlusToTargetDuringCombatNode(0, spd, def, res);

const GRANTS_ATK_SPD_DEF_RES_TO_TARGET_DURING_COMBAT_NODE =
    (atk, spd = atk, def = atk, res = atk) =>
        new GrantsStatsPlusToTargetDuringCombatNode(atk, spd, def, res);

class GrantsStatPlusAtToTargetDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(index, value) {
        super();
        this._index = NumberNode.makeNumberNodeFrom(index);
        this._value = NumberNode.makeNumberNodeFrom(value);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let value = this._value.evaluate(env);
        let values = new Array(4).fill(0).map((_, i) => i === this._index.evaluate(env) ? value : 0);
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...values);
        env.debug(`${unit.nameWithGroup}の攻撃/速さ/守備/魔防+[${values}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

const GRANTS_STAT_PLUS_AT_TO_TARGET_DURING_COMBAT_NODE =
    (index, value) => new GrantsStatPlusAtToTargetDuringCombatNode(index, value);

class GrantsStatPlusAtToUnitDuringCombatNode extends GrantsStatPlusAtToTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const GRANTS_STAT_PLUS_AT_TO_UNIT_DURING_COMBAT_NODE =
    (index, value) => new GrantsStatPlusAtToUnitDuringCombatNode(index, value);

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
        env.popValue();
    }
}

const GRANTS_ALL_STATS_PLUS_N_TO_TARGET_DURING_COMBAT_NODE = (n) => new GrantsAllStatsPlusNToTargetDuringCombatNode(n);

class GrantsAllStatsPlusNToUnitDuringCombatNode extends GrantsAllStatsPlusNToTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const GRANTS_ALL_STATS_PLUS_N_TO_UNIT_DURING_COMBAT_NODE = n => new GrantsAllStatsPlusNToUnitDuringCombatNode(n);

const GRANTS_ALL_STATS_PLUS_4_TO_TARGET_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToTargetDuringCombatNode(4);
const GRANTS_ALL_STATS_PLUS_5_TO_TARGET_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToTargetDuringCombatNode(5);
const GRANTS_ALL_STATS_PLUS_8_TO_TARGET_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToTargetDuringCombatNode(8);
const GRANTS_ALL_STATS_PLUS_9_TO_TARGET_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToTargetDuringCombatNode(9);

const GRANTS_ALL_STATS_PLUS_4_TO_UNIT_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToUnitDuringCombatNode(4);
const GRANTS_ALL_STATS_PLUS_5_TO_UNIT_DURING_COMBAT_NODE = new GrantsAllStatsPlusNToUnitDuringCombatNode(5);

const GRANTS_ATK_SPD_PLUS_4_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(4, 4, 0, 0)
const GRANTS_ATK_SPD_PLUS_5_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(5, 5, 0, 0)
const GRANTS_ATK_SPD_PLUS_6_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(6, 6, 0, 0)
const GRANTS_ATK_SPD_PLUS_7_TO_UNIT_DURING_COMBAT_NODE = new GrantsStatsPlusToUnitDuringCombatNode(7, 7, 0, 0)

class GrantsOrInflictsTargetsStatsDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {StatsNode} statsNode
     */
    constructor(statsNode) {
        super();
        this._statsNode = statsNode;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let stats = this._statsNode.evaluate(env);
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...stats);
        env.debug(`${unit.nameWithGroup}は戦闘中ステータス+[${stats}]: [${beforeSpurs}] → [${unit.getSpurs()}]`);
    }
}

const GRANTS_OR_INFLICTS_TARGETS_STATS_DURING_COMBAT_NODE = statsNode => new GrantsOrInflictsTargetsStatsDuringCombatNode(statsNode);
const GRANTS_OR_INFLICTS_TARGETS_STAT_DURING_COMBAT_NODE = (index, value) =>
    GRANTS_OR_INFLICTS_TARGETS_STATS_DURING_COMBAT_NODE(STATS_FROM_STAT_NODE(value, index));

class TargetsStatsAreHighestStatsFromNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {StatsNode} statsNode
     * @param {[boolean|BoolNode, boolean|BoolNode, boolean|BoolNode, boolean|BoolNode]} statsFlags
     */
    constructor(statsNode, statsFlags) {
        super();
        this._statsNode = statsNode;
        this._statsFlags = statsFlags.map(x => BoolNode.makeBoolNodeFrom(x));
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let [atk, spd, def, res] = this._statsNode.evaluate(env);
        let [atkFlag, spdFlag, defFlag, resFlag] =
            this._statsFlags.map(x => x.evaluate(env));
        let stats = [atk, spd, def, res];
        let flags = [atkFlag, spdFlag, defFlag, resFlag];
        env.debug(`${unit.nameWithGroup}は高い方の値をステータスに設定(ユニット: [${unit.getStatusesInPrecombat()}], 値: [${stats}], 差: [${ArrayUtil.sub(stats, unit.getStatusesInPrecombat())}], 対象ステータス: [${flags}])`);
        if (atkFlag) unit.atkSpur += atk - unit.getAtkInPrecombat();
        if (spdFlag) unit.spdSpur += spd - unit.getSpdInPrecombat();
        if (defFlag) unit.defSpur += def - unit.getDefInPrecombat();
        if (resFlag) unit.resSpur += res - unit.getResInPrecombat();
    }
}

const TARGETS_STATS_ARE_HIGHEST_STATS_FROM_NODE =
    statsNode => new TargetsStatsAreHighestStatsFromNode(statsNode, [true, true, true, true]);

/**
 * @abstract
 */
class StatsNode extends NumbersNode {
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
        let result = this.evaluateChildren(env);
        env.trace(`各要素を評価: [${result}]`)
        return result;
    }
}

const STATS_NODE = (atk, spd, def, res) => StatsNode.makeStatsNodeFrom(atk, spd, def, res);

const ATK_NODE = n => StatsNode.makeStatsNodeFrom(n, 0, 0, 0);
const SPD_NODE = n => StatsNode.makeStatsNodeFrom(0, n, 0, 0);
const DEF_NODE = n => StatsNode.makeStatsNodeFrom(0, 0, n, 0);
const RES_NODE = n => StatsNode.makeStatsNodeFrom(0, 0, 0, n);

const ATK_SPD_NODE = (atk, spd = atk) => StatsNode.makeStatsNodeFrom(atk, spd, 0, 0);
const ATK_DEF_NODE = (atk, def = atk) => StatsNode.makeStatsNodeFrom(atk, 0, def, 0);
const ATK_RES_NODE = (atk, res = atk) => StatsNode.makeStatsNodeFrom(atk, 0, 0, res);
const SPD_DEF_NODE = (spd, def = spd) => StatsNode.makeStatsNodeFrom(0, spd, def, 0);
const SPD_RES_NODE = (spd, res = spd) => StatsNode.makeStatsNodeFrom(0, spd, 0, res);
const DEF_RES_NODE = (def, res = def) => StatsNode.makeStatsNodeFrom(0, 0, def, res);

const ATK_SPD_DEF_NODE = (atk, spd = atk, def = atk) => StatsNode.makeStatsNodeFrom(atk, spd, def, 0);
const ATK_SPD_RES_NODE = (atk, spd = atk, res = atk) => StatsNode.makeStatsNodeFrom(atk, spd, 0, res);
const ATK_DEF_RES_NODE = (atk, def = atk, res = atk) => StatsNode.makeStatsNodeFrom(atk, 0, def, res);
const SPD_DEF_RES_NODE = (spd, def = spd, res = spd) => StatsNode.makeStatsNodeFrom(0, spd, def, res);

class MultStatsNode extends StatsNode {
    constructor(...statsNodes) {
        super(...statsNodes);
    }

    evaluate(env) {
        let statsArray = this.evaluateChildren(env);
        return ArrayUtil.mult(...statsArray);
    }
}

const MULT_STATS_NODE = (...statsNodes) => new MultStatsNode(...statsNodes);

class GetStatAtNode extends NumberNode {
    /**
     * @param {StatsNode} statsNode
     * @param {number|NumberNode} index
     */
    constructor(statsNode, index) {
        super();
        this._statsNode = statsNode;
        this._indexNode = NumberNode.makeNumberNodeFrom(index);
    }

    evaluate(env) {
        let stats = this._statsNode.evaluate(env);
        let index = this._indexNode.evaluate(env);
        let result = stats[index];
        env.debug(`ステータス = ${result}: [${stats}][${index}]`);
        return result;
    }
}

/**
 * @param {StatsNode} statsNode
 * @param {number|NumberNode} index
 * @returns {GetStatAtNode}
 * @constructor
 */
const GET_STAT_AT_NODE = (statsNode, index) => new GetStatAtNode(statsNode, index);

class StatsFromStatNode extends StatsNode {
    /**
     * @param {number|NumberNode} stat
     * @param {number|NumberNode} index
     */
    constructor(stat, index) {
        super()
        this._statNode = NumberNode.makeNumberNodeFrom(stat);
        this._indexNode = NumberNode.makeNumberNodeFrom(index);
    }

    evaluate(env) {
        let stats = [0, 0, 0, 0];
        stats[this._indexNode.evaluate(env)] = this._statNode.evaluate(env);
        return stats;
    }
}

const STATS_FROM_STAT_NODE = (stat, index) => new StatsFromStatNode(stat, index);

class ForEachStatIndexNode extends SkillEffectNode {
    /**
     * @param {(number|NumberNode)[]} targetIndicesNodes
     * @param {SkillEffectNode} nodes
     */
    constructor(targetIndicesNodes, ...nodes) {
        super(...nodes);
        this._targetIndicesNodes = targetIndicesNodes.map(x => NumberNode.makeNumberNodeFrom(x));
    }

    evaluate(env) {
        let targetIndices = this._targetIndicesNodes.map(x => x.evaluate(env));
        env.debug(`対象のステータス${targetIndices.map(x => getStatusName(x))}それぞれについて`);
        for (let i = 0; i < 4; i++) {
            if (!targetIndices.includes(i)) {
                env.debug(`${getStatusName(i)}は対象ではない`);
                continue;
            }
            env.debug(`${getStatusName(i)}について`);
            env.storeValue(i);
            super.evaluate(env);
            env.popValue();
        }
    }
}

/**
 * @param {SkillEffectNode} nodes
 * @returns {SkillEffectNode}
 * @constructor
 */
const FOR_EACH_STAT_INDEX_NODE =
    (...nodes) => new ForEachStatIndexNode(
        [STATUS_INDEX.Atk, STATUS_INDEX.Spd, STATUS_INDEX.Res, STATUS_INDEX.Def], ...nodes);

const FOR_EACH_TARGET_STAT_INDEX_NODE =
    (targetIndices, ...nodes) => new ForEachStatIndexNode(targetIndices, ...nodes);

class HighestValueOnEachStatAmongUnitsNode extends StatsNode {
    /**
     * @param {UnitsNode} unitsNode
     * @param {StatsNode} funcNode
     */
    constructor(unitsNode, funcNode) {
        super();
        this._unitsNode = unitsNode;
        this._funcNode = funcNode;
    }

    evaluate(env) {
        let units = Array.from(this._unitsNode.evaluate(env));
        let evaluated = units.map(u => this._funcNode.evaluate(env.copy().setTarget(u)));
        env.trace(`Units: ${units.map(u => u.nameWithGroup)} => values array: [${evaluated.map(a => `[${a}]`)}]`);
        let result = ArrayUtil.maxByIndex(...evaluated);
        env.trace(`Highest values: [${result}]`);
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

const GRANTS_GREAT_TALENTS_PLUS_TO_TARGET_NODE =
    (statsNode, maxStatsNode) => new GrantsGreatTalentsPlusToTargetNode(statsNode, maxStatsNode);

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

const INFLICTS_STATS_MINUS_ON_FOE_DURING_COMBAT_NODE =
    (atk, spd, def, res) => new InflictsStatsMinusOnFoeDuringCombatNode(atk, spd, def, res);

const INFLICTS_ALL_STATS_MINUS_2_ON_FOE_DURING_COMBAT_NODE = new InflictsStatsMinusOnFoeDuringCombatNode(2, 2, 2, 2);
const INFLICTS_ALL_STATS_MINUS_3_ON_FOE_DURING_COMBAT_NODE = new InflictsStatsMinusOnFoeDuringCombatNode(3, 3, 3, 3);
const INFLICTS_ALL_STATS_MINUS_4_ON_FOE_DURING_COMBAT_NODE = new InflictsStatsMinusOnFoeDuringCombatNode(4, 4, 4, 4);
const INFLICTS_ALL_STATS_MINUS_5_ON_FOE_DURING_COMBAT_NODE = new InflictsStatsMinusOnFoeDuringCombatNode(5, 5, 5, 5);

const GRANTS_BONUS_TO_TARGETS_ATK_SPD_DEF_RES_NODE = (atk, spd = atk, def = atk, res = atk) =>
    new GrantsStatsPlusToTargetDuringCombatNode(atk, spd, def, res);
const GRANTS_ALL_BONUSES_TO_TARGETS_NODE = x =>
    X_NUM_NODE(
        GRANTS_BONUS_TO_TARGETS_ATK_SPD_DEF_RES_NODE(READ_NUM_NODE),
        x
    );

const INFLICTS_ATK_ON_FOE_DURING_COMBAT_NODE = atk =>
    new InflictsStatsMinusOnFoeDuringCombatNode(atk, 0, 0, 0);
const INFLICTS_SPD_ON_FOE_DURING_COMBAT_NODE = spd =>
    new InflictsStatsMinusOnFoeDuringCombatNode(0, spd, 0, 0);
const INFLICTS_DEF_ON_FOE_DURING_COMBAT_NODE = def =>
    new InflictsStatsMinusOnFoeDuringCombatNode(0, 0, def, 0);

const INFLICTS_ATK_SPD_ON_FOE_DURING_COMBAT_NODE = (atk, spd = atk) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(atk, spd, 0, 0);
const INFLICTS_ATK_DEF_ON_FOE_DURING_COMBAT_NODE = (atk, def = atk) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(atk, 0, def, 0);
const INFLICTS_ATK_RES_ON_FOE_DURING_COMBAT_NODE = (atk, res = atk) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(atk, 0, 0, res);
const INFLICTS_SPD_DEF_ON_FOE_DURING_COMBAT_NODE = (spd, def = spd) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(0, spd, def, 0);
const INFLICTS_SPD_RES_ON_FOE_DURING_COMBAT_NODE = (spd, res = spd) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(0, spd, 0, res);

const INFLICTS_ATK_SPD_DEF_ON_FOE_DURING_COMBAT_NODE = (atk, spd = atk, def = atk) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(atk, spd, def, 0);
const INFLICTS_ATK_SPD_RES_ON_FOE_DURING_COMBAT_NODE = (atk, spd = atk, res = atk) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(atk, spd, 0, res);
const INFLICTS_ATK_DEF_RES_ON_FOE_DURING_COMBAT_NODE = (atk, def = atk, res = atk) =>
    new InflictsStatsMinusOnFoeDuringCombatNode(atk, 0, def, res);

class InflictsStatMinusAtOnTargetDuringCombatNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(index, value) {
        super();
        this._index = NumberNode.makeNumberNodeFrom(index);
        this._value = NumberNode.makeNumberNodeFrom(value);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let value = this._value.evaluate(env);
        let values = new Array(4).fill(0).map((_, i) => i === this._index.evaluate(env) ? value : 0);
        let beforeSpurs = unit.getSpurs();
        unit.addSpurs(...values.map(v => -v));
        env.debug(`${unit.nameWithGroup}は攻撃/速さ/守備/魔坊-[${values}]: [${beforeSpurs}] => [${unit.getSpurs()}]`);
    }
}

const INFLICTS_STAT_MINUS_AT_ON_TARGET_DURING_COMBAT_NODE =
    (index, value) => new InflictsStatMinusAtOnTargetDuringCombatNode(index, value);

class InflictsStatMinusAtOnFoeDuringCombatNode extends InflictsStatMinusAtOnTargetDuringCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const INFLICTS_STAT_MINUS_AT_ON_FOE_DURING_COMBAT_NODE =
    (index, value) => new InflictsStatMinusAtOnFoeDuringCombatNode(index, value);

class InflictsAllStatsMinusNOnTargetDuringCombatNode extends InflictsStatsMinusOnTargetDuringCombatNode {
    constructor(n) {
        super(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE);
        this._n = NumberNode.makeNumberNodeFrom(n);
    }
}

const INFLICTS_ALL_STATS_MINUS_N_ON_TARGET_DURING_COMBAT_NODE =
    n => X_NUM_NODE(
        new InflictsStatsMinusOnTargetDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE),
        NumberNode.makeNumberNodeFrom(n),
    );

const INFLICTS_ALL_STATS_MINUS_N_ON_FOE_DURING_COMBAT_NODE =
    n => X_NUM_NODE(
        new InflictsStatsMinusOnFoeDuringCombatNode(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE),
        NumberNode.makeNumberNodeFrom(n),
    );

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

const TARGETS_MAX_HP_NODE = new TargetsMaxHpNode();

class FoesMaxHpNode extends TargetsMaxHpNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class SkillOwnerMaxHpNode extends TargetsMaxHpNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const SKILL_OWNER_MAX_HP_NODE = new SkillOwnerMaxHpNode();

class TargetsMaxHpExcludingHpIncreasesFromLegendaryEffectsMythicEffectsBonusHeroesEtc extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.maxHpWithSkillsWithoutEnteringBattleHpAdd;
        env.debug(`${unit.nameWithGroup}の出撃時の最大HP: ${result}`);
        return result;
    }
}

const TARGETS_MAX_HP_EXCLUDING_HP_INCREASES_FROM_LEGENDARY_EFFECTS_MYTHIC_EFFECTS_BONUS_HEROES_ETC_NODE =
    new TargetsMaxHpExcludingHpIncreasesFromLegendaryEffectsMythicEffectsBonusHeroesEtc();

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

class TargetsStatOnMapNode extends GetStatNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    statsDescription = "マップ時";

    getStats(env) {
        return this.getUnit(env).getStatusesInPrecombat();
    }
}

class TargetsEvalStatOnMapNode extends GetStatNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    statsDescription = "マップ時";

    getStats(env) {
        return this.getUnit(env).getEvalStatusesInPrecombat();
    }
}

class TargetsStatAtStartOfTurnNode extends GetStatNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    statsDescription = "開始時";

    getStats(env) {
        return this.getUnit(env).getStatusesInPrecombat();
    }
}

class SkillOwnersStatOnMapNode extends TargetsStatOnMapNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

class SkillOwnersEvalStatOnMapNode extends TargetsEvalStatOnMapNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

class UnitsStatAtStartOfCombatNode extends GetStatNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }

    statsDescription = "戦闘開始時";

    getStats(env) {
        return this.getUnit(env).getStatusesInPrecombat();
    }
}

class FoesStatAtStartOfCombatNode extends UnitsStatAtStartOfCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class UnitsEvalStatAtStartOfCombatNode extends UnitsStatAtStartOfCombatNode {
    statsDescription = "戦闘開始時の比較時";

    getStats(env) {
        return this.getUnit(env).getEvalStatusesInPrecombat();
    }
}

class FoesEvalStatAtStartOfCombatNode extends UnitsEvalStatAtStartOfCombatNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

// noinspection JSUnusedGlobalSymbols
const UNITS_STAT_AT_START_OF_COMBAT_NODE = index => new UnitsStatAtStartOfCombatNode(index);
const UNITS_ATK_AT_START_OF_COMBAT_NODE = new UnitsStatAtStartOfCombatNode(STATUS_INDEX.Atk);
const UNITS_SPD_AT_START_OF_COMBAT_NODE = new UnitsStatAtStartOfCombatNode(STATUS_INDEX.Spd);
// noinspection JSUnusedGlobalSymbols
const UNITS_DEF_AT_START_OF_COMBAT_NODE = new UnitsStatAtStartOfCombatNode(STATUS_INDEX.Def);
const UNITS_RES_AT_START_OF_COMBAT_NODE = new UnitsStatAtStartOfCombatNode(STATUS_INDEX.Res);

const FOES_STAT_AT_START_OF_COMBAT_NODE = index => new FoesStatAtStartOfCombatNode(index);
const FOES_ATK_AT_START_OF_COMBAT_NODE = new FoesStatAtStartOfCombatNode(STATUS_INDEX.Atk);
const FOES_SPD_AT_START_OF_COMBAT_NODE = new FoesStatAtStartOfCombatNode(STATUS_INDEX.Spd);
const FOES_DEF_AT_START_OF_COMBAT_NODE = new FoesStatAtStartOfCombatNode(STATUS_INDEX.Def);
const FOES_RES_AT_START_OF_COMBAT_NODE = new FoesStatAtStartOfCombatNode(STATUS_INDEX.Res);

const UNITS_EVAL_STAT_AT_START_OF_COMBAT_NODE = index => new UnitsEvalStatAtStartOfCombatNode(STATUS_INDEX.Atk);
const UNITS_EVAL_ATK_AT_START_OF_COMBAT_NODE = UNITS_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Atk);
const UNITS_EVAL_SPD_AT_START_OF_COMBAT_NODE = UNITS_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Spd);
const UNITS_EVAL_DEF_AT_START_OF_COMBAT_NODE = UNITS_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Def);
const UNITS_EVAL_RES_AT_START_OF_COMBAT_NODE = UNITS_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Res);

const FOES_EVAL_STAT_AT_START_OF_COMBAT_NODE = index => new FoesEvalStatAtStartOfCombatNode(STATUS_INDEX.Atk);
const FOES_EVAL_ATK_AT_START_OF_COMBAT_NODE = FOES_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Atk);
const FOES_EVAL_SPD_AT_START_OF_COMBAT_NODE = FOES_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Spd);
const FOES_EVAL_DEF_AT_START_OF_COMBAT_NODE = FOES_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Def);
const FOES_EVAL_RES_AT_START_OF_COMBAT_NODE = FOES_EVAL_STAT_AT_START_OF_COMBAT_NODE(STATUS_INDEX.Res);

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
const UNITS_STAT_DURING_COMBAT_NODE = index => new UnitsStatsDuringCombat(index);
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

const FOES_STAT_DURING_COMBAT_NODE = index => new FoesStatsDuringCombatNode(index);
const FOES_ATK_DURING_COMBAT_NODE = new FoesStatsDuringCombatNode(STATUS_INDEX.Atk);
const FOES_SPD_DURING_COMBAT_NODE = new FoesStatsDuringCombatNode(STATUS_INDEX.Spd);
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

class TargetsStatsOnMapNode extends StatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.getStatusesInPrecombat();
        env.debug(`${unit.nameWithGroup}のマップでのステータス: [${result}]`);
        return result;
    }
}

const TARGETS_STATS_ON_MAP_NODE = new TargetsStatsOnMapNode();

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
class FromBoolStatsNode extends SkillEffectNode {
    /**
     * @param {boolean|BoolNode} atk
     * @param {boolean|BoolNode} spd
     * @param {boolean|BoolNode} def
     * @param {boolean|BoolNode} res
     */
    constructor(atk, spd, def, res) {
        super(BoolNode.makeBoolNodeFrom(atk), BoolNode.makeBoolNodeFrom(spd),
            BoolNode.makeBoolNodeFrom(def), BoolNode.makeBoolNodeFrom(res));
    }

    /**
     * @param env
     * @returns {[boolean, boolean, boolean, boolean]}
     */
    evaluateChildren(env) {
        return super.evaluateChildren(env);
    }
}

/**
 * @abstract
 */
class ApplyingNumberToEachStatNode extends FromNumbersNode {
    /**
     * @param {number|NumberNode|NumbersNode} atkOrStats
     * @param {number|NumberNode} spd
     * @param {number|NumberNode} def
     * @param {number|NumberNode} res
     */
    constructor(atkOrStats, spd, def, res) {
        super(...[atkOrStats, spd, def, res].map(v => NumberNode.makeNumberNodeFrom(v)));
    }
}

class HasTargetUsedAssistDuringCurrentTurnNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetValueMixin);
    }

    debugMessage = "は現在ターン中に補助を使用したか";

    getValue(unit) {
        return unit.isSupportDone;
    }
}

const HAS_TARGET_USED_ASSIST_DURING_CURRENT_TURN_NODE = new HasTargetUsedAssistDuringCurrentTurnNode();

class HasSkillOwnerUsedAssistDuringCurrentTurnNode extends HasTargetUsedAssistDuringCurrentTurnNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const HAS_SKILL_OWNER_USED_ASSIST_DURING_CURRENT_TURN_NODE = new HasSkillOwnerUsedAssistDuringCurrentTurnNode();

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

class IfTargetsSpecialIsReadyOrHasTriggeredDuringCombatNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.canActivateOrActivatedSpecial();
        env.debug(`${unit.nameWithGroup}が奥義発動可能もしくは発動済みであるか: ${result}`);
        return result;
    }
}

const IF_TARGETS_SPECIAL_IS_READY_OR_HAS_TRIGGERED_DURING_COMBAT_NODE =
    new IfTargetsSpecialIsReadyOrHasTriggeredDuringCombatNode();

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

class IsPenaltyActiveOnTargetNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.hasNegativeStatusEffect()
        env.debug(`${unit.nameWithGroup}は不利な状態を受けているか: ${result}`);
        return result;
    }
}

const IS_PENALTY_ACTIVE_ON_TARGET_NODE = new IsPenaltyActiveOnTargetNode();

class IsPenaltyActiveOnUnitNode extends IsPenaltyActiveOnTargetNode {
    static {
        Object.assign(this.prototype, GetUnitDuringCombatMixin);
    }
}

const IS_PENALTY_ACTIVE_ON_UNIT_NODE = new IsPenaltyActiveOnUnitNode();

/**
 * If【Penalty】is active on foe,
 */
class IsPenaltyActiveOnFoeNode extends IsPenaltyActiveOnTargetNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const IS_PENALTY_ACTIVE_ON_FOE_NODE = new IsPenaltyActiveOnFoeNode();

const NUM_OF_COMBAT_ON_CURRENT_TURN_NODE = new class extends PositiveNumberNode {
    evaluate(env) {
        let result = g_appData?.globalBattleContext?.numOfCombatOnCurrentTurn ?? 0;
        env.debug(`現在のターンで行われた戦闘回数: ${result}`);
        return result;
    }
}();

class NumOfTargetsFoesDefeatedByTargetTeamOnCurrentTurnNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = g_appData?.globalBattleContext?.removedUnitCountInCombatInCurrentTurnsPhase[unit.enemyGroupId] ?? 0;
        env.debug(`${unit.nameWithGroup}の軍が撃破した敵の数: ${result}`);
        return result;
    }
}

const NUM_OF_TARGETS_FOES_DEFEATED_BY_TARGET_TEAM_ON_CURRENT_TURN_NODE
    = new NumOfTargetsFoesDefeatedByTargetTeamOnCurrentTurnNode();

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
}();

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

const TARGETS_SPECIAL_COUNT_AT_START_OF_TURN_NODE = new TargetsSpecialCountAtStartOfTurnNode();

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

const TARGETS_MAX_SPECIAL_COUNT_NODE = new TargetsMaxSpecialCountNode();

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

const HAS_TARGET_STATUS_EFFECT_NODE = n => new HasTargetStatusEffectNode(n);

class HasFoeStatusEffectNode extends HasTargetStatusEffectNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class HasAssistTargetingStatusEffectNode extends HasTargetStatusEffectNode {
    static {
        Object.assign(this.prototype, GetAssistTargetingMixin);
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

const NUM_OF_TARGETS_DRAGONFLOWERS_NODE = new NumOfTargetsDragonflowersNode();

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

const TARGETS_MOVE_TYPE_NODE = new TargetsMoveTypeNode();

// TODO: マップ上でのRangeを取得するノードを作成する（かぜの剣スタイルなど）
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

const TARGETS_RANGE_NODE = new TargetsRangeNode();

class FoesRangeNode extends TargetsRangeNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOES_RANGE_NODE = new FoesRangeNode();

class TargetsWeaponTypeNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.weaponType;
        env.debug(`${unit.nameWithGroup}の武器タイプ: ${ObjectUtil.getKeyName(WeaponType, result)}`);
        return result;
    }
}

const TARGETS_WEAPON_TYPE_NODE = new TargetsWeaponTypeNode();

class IsTargetTomeTypeNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = isWeaponTypeTome(unit.weaponType);
        env.debug(`${unit.nameWithGroup}は魔法であるか: ${result}`);
        return result;
    }
}

const IS_TARGET_TOME_TYPE_NODE = new IsTargetTomeTypeNode();
const IS_TARGET_MAGIC_TYPE_NODE = IS_TARGET_TOME_TYPE_NODE;
const DOES_TARGET_USE_MAGIC_NODE = IS_TARGET_TOME_TYPE_NODE;

class DoesFoeUseMagicNode extends IsTargetTomeTypeNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const DOES_FOE_USE_MAGIC_NODE = new DoesFoeUseMagicNode();

class IsTargetStaffTypeNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.weaponType === WeaponType.Staff;
        env.debug(`${unit.nameWithGroup}は杖であるか: ${result}`);
        return result;
    }
}

const IS_TARGET_STAFF_TYPE_NODE = new IsTargetStaffTypeNode();

class IsTargetDragonTypeNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = isWeaponTypeBeast(unit.weaponType);
        env.debug(`${unit.nameWithGroup}は竜であるか: ${result}`);
        return result;
    }
}

const IS_TARGET_DRAGON_TYPE_NODE = new IsTargetDragonTypeNode();

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

class IsFoeBeastOrDragonTypeNode extends IsTargetBeastOrDragonTypeNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const IS_FOE_BEAST_OR_DRAGON_TYPE_NODE = new IsFoeBeastOrDragonTypeNode();

class IsTargetInfantryNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.moveType === MoveType.Infantry;
        env.debug(`${unit.nameWithGroup}は歩行か: ${result}`);
        return result;
    }
}

class IsFoeInfantryNode extends IsTargetInfantryNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

class IsTargetArmorNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.moveType === MoveType.Armor;
        env.debug(`${unit.nameWithGroup}は重装か: ${result}`);
        return result;
    }
}

class IsFoeArmorNode extends IsTargetArmorNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
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

const IS_TARGET_MELEE_WEAPON_NODE = new IsTargetMeleeWeaponNode();

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

const IS_TARGET_RANGED_WEAPON_NODE = new IsTargetRangedWeaponNode();

class IsFoeRangedWeaponNode extends IsTargetRangedWeaponNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const IS_FOE_RANGED_WEAPON_NODE = new IsFoeRangedWeaponNode();

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

const DOES_TARGET_TRIGGER_SAVIOR_NODE = new DoesTargetTriggerSaviorNode();

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

const TARGETS_TOTAL_PENALTIES_NODE = new TargetsTotalPenaltiesNode();

const FOES_TOTAL_PENALTIES_NODE = new class extends TargetsTotalPenaltiesNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}();

class TargetsPenaltiesNode extends StatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        /** @type {Unit} */
        let unit = this.getUnit(env);
        let result = unit.getDebuffTotals(unit !== env.foeDuringCombat).map(v => -v);
        env.debug(`${unit.nameWithGroup}の弱化は[${result}]`);
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
        Object.assign(this.prototype, GetSkillOwnerMixin);
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

const NEUTRALIZES_ANY_PENALTY_ON_TARGET_NODE = new class extends SkillEffectNode {
    evaluate(env) {
        let unit = env.target;
        env.debug(`${unit.nameWithGroup}の弱化を解除`);
        unit.neutralizeAllDebuffs();
        env.debug(`${unit.nameWithGroup}の不利なステータスを解除`);
        unit.neutralizeNegativeStatusEffects();
    }
}();

class RestoreTargetsHpOnMapNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.reserveHeal(n);
        env.debug(`${unit.nameWithGroup}はHPが${n}回復予約`);
    }
}

const RESTORE_TARGETS_HP_ON_MAP_NODE = n => new RestoreTargetsHpOnMapNode(n);

class RestoreTargetsHpNeutralizesDeepWoundsOnMapNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this.evaluateChildren(env);
        unit.reserveHealNeutralizesDeepWounds(n);
        env.debug(`${unit.nameWithGroup}はHPが${n}回復予約(回復不可無効)`);
    }
}

const RESTORE_TARGETS_HP_NEUTRALIZES_DEEP_WOUNDS_ON_MAP_NODE =
    n => new RestoreTargetsHpNeutralizesDeepWoundsOnMapNode(n);

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

const RESTORE_TARGET_HP_NODE = n => new RestoreTargetHpNode(n);

class ForEachNode extends SkillEffectNode {
}

class ForEachUnitNode extends ForEachNode {
    /**
     * @param {UnitsNode} unitsNode
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} nodes
     */
    constructor(unitsNode, predNode, ...nodes) {
        super(...nodes);
        this._unitsNode = unitsNode;
        this._predNode = predNode;
    }

    evaluate(env) {
        let units = this._unitsNode.evaluate(env);
        for (let unit of units) {
            if (this._predNode.evaluate(env.copy().setTarget(unit))) {
                env.debug(`${unit.nameWithGroup}を対象に選択`);
                this.evaluateChildren(env.copy().setTarget(unit));
            } else {
                env.trace3(`${unit.nameWithGroup}は対象外`);
            }
        }
    }
}

const FOR_EACH_UNIT_NODE = (unitsNode, ...nodes) => new ForEachUnitNode(unitsNode, TRUE_NODE, ...nodes);

class TargetsFoesNode extends UnitsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        return env.unitManager.enumerateUnitsInDifferentGroupOnMap(unit);
    }
}

const TARGETS_FOES_NODE = new TargetsFoesNode();

class IsTargetSkillOwnerNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit === env.skillOwner;
        env.debug(`${unit.nameWithGroup}はスキル所持者${env.skillOwner.nameWithGroup}と同一ユニットか: ${result}`);
        return result;
    }
}

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

class TargetsAndThoseAlliesWithinNSpacesNode extends UnitsNode {
    /**
     * @param {number|NumberNode} n
     * @param {UnitNode|UnitsNode} unitsNode
     */
    constructor(n, unitsNode) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._unitsNode = UnitsNode.makeFromUnit(unitsNode);
    }

    evaluate(env) {
        let n = this._nNode.evaluate(env);
        let units = this._unitsNode.evaluate(env);
        let results = new Set();
        for (let unit of units) {
            let allies = env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, n, true);
            let allyArray = Array.from(allies);
            env.trace2(`${unit.nameWithGroup}と周囲${n}マスの同軍: ${allyArray.map(u => u.nameWithGroup).join(", ")}`);
            allyArray.forEach(u => results.add(u));
            // results.push(allies);
        }
        env.trace2(`${Array.from(units).map(u => u.nameWithGroup).join(", ")}とその周囲${n}マスの同軍: ${Array.from(results).map(u => u.nameWithGroup).join(", ")}`);
        return results;
    }
}

const TARGETS_AND_THOSE_ALLIES_WITHIN_N_SPACES_NODE =
    (n, unitsNode) => new TargetsAndThoseAlliesWithinNSpacesNode(n, unitsNode);

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

class ForEachTargetsAllyWithinNSpacesNode extends ForEachAllyNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} pred
     * @param {...SkillEffectNode} children
     */
    constructor(n, pred, ...children) {
        super(pred, ...children);
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    getUnits(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        let pred = u => this._predNode.evaluate(env.copy().setTarget(u));
        return GeneratorUtil.filter(env.unitManager.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, n), pred);
    }
}

const FOR_EACH_TARGETS_ALLY_WITHIN_N_SPACES_NODE =
    (n, ...nodes) => new ForEachTargetsAllyWithinNSpacesNode(n, TRUE_NODE, ...nodes);

const FOR_EACH_TARGETS_ALLY_WITHIN_2_SPACES_NODE =
    (...nodes) => new ForEachTargetsAllyWithinNSpacesNode(2, TRUE_NODE, ...nodes);

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
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

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
        let unit = this.getUnit(env);
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

const FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_N_SPACES_OF_TARGET_NODE =
    (n, ...nodes) => new ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode(n, TRUE_NODE, ...nodes);

const FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_2_SPACES_OF_TARGET_NODE =
    (...children) => FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_N_SPACES_OF_TARGET_NODE(2, ...children);

const FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_3_SPACES_OF_TARGET_NODE =
    (...children) => FOR_EACH_TARGET_AND_TARGETS_ALLY_WITHIN_N_SPACES_OF_TARGET_NODE(3, ...children);

class ForEachFoeAndFoesAllyWithinNSpacesOfTargetNode extends ForEachTargetAndTargetsAllyWithinNSpacesOfTargetNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOR_EACH_FOE_AND_FOES_ALLY_WITHIN_N_SPACES_OF_TARGET_NODE =
    (n, pred, ...nodes) => new ForEachFoeAndFoesAllyWithinNSpacesOfTargetNode(n, pred, ...nodes);

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

class IsTargetWithinNRowsOrNColumnsCenteredOnFoeNode extends IsTargetWithinNRowsOrNColumnsCenteredOnSkillOwnerNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let foe = env.foeDuringCombat;
        let n = this.evaluateChildren(env);
        let result = unit.isInCrossWithOffset(foe, Math.trunc(n / 2));
        env.debug(`${foe.nameWithGroup}の縦${n}列と横${n}列の範囲に${unit.nameWithGroup}がいるか: ${result}`);
        return result;
    }
}

const IS_TARGET_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_FOE_NODE = n => new IsTargetWithinNRowsOrNColumnsCenteredOnFoeNode(n);
const IS_TARGET_WITHIN_3_ROWS_OR_3_COLUMNS_CENTERED_ON_FOE_NODE =
    IS_TARGET_WITHIN_N_ROWS_OR_N_COLUMNS_CENTERED_ON_FOE_NODE(3);

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

class ForEachTargetsClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode extends ForEachUnitOnMapNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

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
        let unit = this.getUnit(env);
        let enemies = env.unitManager.enumerateUnitsInDifferentGroupOnMap(unit);
        let closestUnits = IterUtil.minElements(enemies, u => u.distance(unit));
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

class ForEachTargetsClosestFoeAndAnyFoeWithin2SpacesOfThoseFoesNode extends ForEachTargetsClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode {
    /**
     * @param {BoolNode} predNode
     * @param {...SkillEffectNode} children
     */
    constructor(predNode, ...children) {
        super(2, predNode, ...children);
    }
}

const FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_N_SPACES_OF_THOSE_FOES_NODE =
    (n, ...children) => new ForEachTargetsClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode(n, TRUE_NODE, ...children);

const FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE =
    (...children) => FOR_EACH_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(2, TRUE_NODE, ...children);

class ForEachAssistTargetsClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode extends ForEachTargetsClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode {
    static {
        Object.assign(this.prototype, GetAssistTargetMixin);
    }
}

const FOR_EACH_ASSIST_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_N_SPACES_OF_THOSE_FOES_NODE =
    (n, ...children) => new ForEachAssistTargetsClosestFoeAndAnyFoeWithinNSpacesOfThoseFoesNode(n, TRUE_NODE, ...children);
const FOR_EACH_ASSIST_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_2_SPACES_OF_THOSE_FOES_NODE =
    (...children) => FOR_EACH_ASSIST_TARGETS_CLOSEST_FOE_AND_ANY_FOE_WITHIN_N_SPACES_OF_THOSE_FOES_NODE(2, ...children);

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

const FOR_EACH_UNIT_FROM_SAME_TITLES_NODE = (...nodes) => new ForEachUnitFromSameTitlesNode(...nodes);

class AppliesPotentEffectNode extends FromNumbersNode {
    /**
     * @param {number|NumberNode} percentage
     * @param {number|NumberNode} spdDiff
     * @param {boolean|BoolNode} isFixed
     */
    constructor(percentage = 40, spdDiff = -25, isFixed = FALSE_NODE) {
        super(NumberNode.makeNumberNodeFrom(percentage), NumberNode.makeNumberNodeFrom(spdDiff));
        this._isFixed = BoolNode.makeBoolNodeFrom(isFixed);
    }

    /**
     * @param {DamageCalculatorWrapperEnv|NodeEnv} env
     */
    evaluate(env) {
        // 追撃の速さ条件を25した状態で追撃の速さ条件を満たしている時（絶対追撃、追撃不可は含まない）、
        // 戦闘中、【神速追撃：ダメージ●%】を発動（〇は、自分が2回攻撃でない、かつ追撃ができない時は80、それ以外は40）
        let [percentage, spdDiff] = this.evaluateChildren(env);
        let isFixed = this._isFixed.evaluate(env);
        let unit = env.unitDuringCombat;
        env.debug(`${unit.nameWithGroup}に神速スキル(${percentage}%, 速さ条件${spdDiff})を適用`);
        env.damageCalculatorWrapper.__applyPotent(unit, env.foeDuringCombat, percentage / 100.0, spdDiff, isFixed);
    }
}

const APPLY_POTENT_EFFECT_NODE = new AppliesPotentEffectNode();
const POTENT_FOLLOW_N_PERCENT_NODE =
    (percentage = 40, spdDiff = -25, isFixed = false) =>
        new AppliesPotentEffectNode(percentage, spdDiff, isFixed);

// Tileへの効果 START

/**
 * @abstract
 */
class IsInRangeNNode extends BoolNode {
    /**
     * @param {number|NumberNode} n
     * @param {BoolNode} predNode
     */
    constructor(n, predNode = TRUE_NODE) {
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
const IS_TARGET_WITHIN_N_SPACES_OF_TARGETS_ALLY_NODE = (n, pred = TRUE_NODE) => new IsTargetWithinNSpacesOfTargetsAllyNode(n, pred);
const IS_TARGET_WITHIN_2_SPACES_OF_TARGETS_ALLY_NODE = new IsTargetWithinNSpacesOfTargetsAllyNode(2, TRUE_NODE);
const IS_TARGET_WITHIN_3_SPACES_OF_TARGETS_ALLY_NODE = new IsTargetWithinNSpacesOfTargetsAllyNode(3, TRUE_NODE);
const IS_TARGET_WITHIN_4_SPACES_OF_TARGETS_ALLY_NODE = new IsTargetWithinNSpacesOfTargetsAllyNode(4, TRUE_NODE);

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
const IS_TARGET_WITHIN_N_SPACES_OF_SKILL_OWNER_NODE = n => new IsTargetWithinNSpacesOfSkillOwnerNode(n, TRUE_NODE);
const IS_TARGET_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE = new IsTargetWithinNSpacesOfSkillOwnerNode(2, TRUE_NODE);
const IS_TARGET_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE = new IsTargetWithinNSpacesOfSkillOwnerNode(3, TRUE_NODE);
const IS_TARGET_WITHIN_4_SPACES_OF_SKILL_OWNER_NODE = new IsTargetWithinNSpacesOfSkillOwnerNode(4, TRUE_NODE);
const IS_TARGET_WITHIN_5_SPACES_OF_SKILL_OWNER_NODE = new IsTargetWithinNSpacesOfSkillOwnerNode(5, TRUE_NODE);
const IS_TARGET_WITHIN_6_SPACES_OF_SKILL_OWNER_NODE = new IsTargetWithinNSpacesOfSkillOwnerNode(6, TRUE_NODE);

class IsSpaceWithinNSpacesOfTargetNode extends IsInRangeNNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        let result = env.tile.calculateDistance(unit.placedTile) <= n;
        env.debug(`${env.tile.toString()}は${unit.nameWithGroup}の${n}マス以内であるか: ${result}`);
        return result;
    }
}

const IS_SPACE_WITHIN_N_SPACES_OF_TARGET_NODE = n => new IsSpaceWithinNSpacesOfTargetNode(n);

class IsSpaceWithinNRowsOrMColumnsCenteredOnTargetNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n, m = n) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._mNode = NumberNode.makeNumberNodeFrom(m);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        let m = this._mNode.evaluate(env);
        let tile = env.tile;
        let result = unit.isPosIsInNRowsOrMColumns(tile.posX, tile.posY, n, m);
        env.debug(`${env.tile.toString()}は${unit.nameWithGroup}(${unit.placedTile})の${n}x${m}の範囲内にあるか: ${result}`);
        return result;
    }
}

const IS_SPACE_WITHIN_N_ROWS_OR_M_COLUMNS_CENTERED_ON_TARGET_NODE =
    (n, m) => new IsSpaceWithinNRowsOrMColumnsCenteredOnTargetNode(n, m);

class IsSpaceWithinNRowsOrMColumnsCenteredOnSkillOwnerNode extends IsSpaceWithinNRowsOrMColumnsCenteredOnTargetNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const IS_SPACE_WITHIN_N_ROWS_OR_M_COLUMNS_CENTERED_ON_SKILL_OWNER_NODE =
    (n, m) => new IsSpaceWithinNRowsOrMColumnsCenteredOnSkillOwnerNode(n, m);

class IsSpaceWithinNSpacesOfSkillOwnerNode extends IsSpaceWithinNSpacesOfTargetNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const IS_SPACE_WITHIN_2_SPACES_OF_SKILL_OWNER_NODE = new IsSpaceWithinNSpacesOfSkillOwnerNode(2, TRUE_NODE);
const IS_SPACE_WITHIN_3_SPACES_OF_SKILL_OWNER_NODE = new IsSpaceWithinNSpacesOfSkillOwnerNode(3, TRUE_NODE);
const IS_SPACE_WITHIN_4_SPACES_OF_SKILL_OWNER_NODE = new IsSpaceWithinNSpacesOfSkillOwnerNode(4, TRUE_NODE);

class IsTargetWithinNSpacesOfAssistTargetNode extends IsInRangeNNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let spaces = this._nNode.evaluate(env);
        let result = unit.distance(env.assistTarget) <= spaces;
        env.debug(`${env.assistTarget.nameWithGroup}の周囲${spaces}マス以内に${unit.nameWithGroup}がいるか: ${result}`);
        return result;
    }
}

class IsTargetWithinNSpacesOfAssistTargetingNode extends IsInRangeNNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let spaces = this._nNode.evaluate(env);
        let result = unit.distance(env.assistTargeting) <= spaces;
        env.debug(`${env.assistTargeting.nameWithGroup}の周囲${spaces}マス以内に${unit.nameWithGroup}がいるか: ${result}`);
        return result;
    }
}

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

const FOR_TARGETS_ALLIES_WITHIN_2_SPACES_OF_TARGET_NODE =
    (...procedureNodes) => new ForTargetsAlliesWithinNSpacesOfTargetNode(2, TRUE_NODE, ...procedureNodes);

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

class IsTargetInCardinalDirectionsOfSkillOwnerNode extends BoolNode {
    evaluate(env) {
        let unit = env.target;
        let skillOwner = env.skillOwner;
        let result = unit.isInCrossOf(skillOwner);
        env.debug(`${unit.nameWithGroup}は${skillOwner.name}の十字方向にいるか: ${result}`);
        return result;
    }
}

const IS_TARGET_IN_CARDINAL_DIRECTIONS_OF_SKILL_OWNER_NODE = new IsTargetInCardinalDirectionsOfSkillOwnerNode();

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
}();

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

class ApplyDivineVeinNode extends SkillEffectNode {
    constructor(divineVein, group, turns = 1) {
        super();
        this._divineVein = NumberNode.makeNumberNodeFrom(divineVein);
        this._group = NumberNode.makeNumberNodeFrom(group);
        this._turns = NumberNode.makeNumberNodeFrom(turns);
    }

    evaluate(env) {
        let tile = env.tile;
        let divineVein = this._divineVein.evaluate(env);
        let groupId = this._group.evaluate(env);
        let turns = this._turns.evaluate(env);
        tile.reserveDivineVein(divineVein, groupId, turns);
    }
}

const APPLY_DIVINE_VEIN_NODE = (divineVein, group, turns) => new ApplyDivineVeinNode(divineVein, group, turns);

// Tileへの効果 END

// Tileを返す START
class ForEachSpacesNode extends ForEachNode {
    constructor(spacesNode, predNode, ...nodes) {
        super(...nodes);
        this._spacesNode = spacesNode;
        this._predNode = predNode;
    }

    evaluate(env) {
        for (let space of this._spacesNode.evaluate(env)) {
            if (this._predNode.evaluate(env.copy().setTile(space))) {
                this.evaluateChildren(env.copy().setTile(space));
            }
        }
    }
}

const FOR_EACH_SPACES_NODE =
    (spacesNode, ...nodes) => new ForEachSpacesNode(spacesNode, TRUE_NODE, ...nodes);

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

const FOR_EACH_ALLY_FOR_SPACES_NODE =
    (predNode, ...children) => new ForEachAllyForSpacesNode(predNode, ...children);

class TargetsPlacableSpacesWithinNSpacesFromSpaceNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {SpacesNode} spacesNode
     */
    constructor(n, spacesNode) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._spacesNode = spacesNode;
    }

    /**
     * @param {NodeEnv} env
     * @returns {Iterable<Tile>}
     */
    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        let resultSet = new Set();
        for (let tile of this._spacesNode.evaluate(env)) {
            let tileSet = new Set(env.battleMap.__enumeratePlacableTilesWithinSpecifiedSpaces(tile, unit, n));
            env.debug(`${unit.nameWithGroup}が移動可能な${tile.toPlacedUnitString()}の周囲${n}以内のマス: ${SetUtil.toString(tileSet)}`);
            resultSet = SetUtil.union(resultSet, tileSet);
        }
        return resultSet;
    }
}

const TARGETS_PLACABLE_SPACES_WITHIN_N_SPACES_FROM_SPACE_NODE =
    (n, spacesNode) => new TargetsPlacableSpacesWithinNSpacesFromSpaceNode(n, spacesNode);

class TargetsPlacableSpacesWithinNSpacesFromUnitsNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {UnitsNode} units
     */
    constructor(n, units) {
        super();
        this._nNode = NumberNode.makeNumberNodeFrom(n);
        this._unitsNode = units;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._nNode.evaluate(env);
        let units = this._unitsNode.evaluate(env);
        let resultSet = new Set();
        for (let u of units) {
            let tileSet = new Set(env.battleMap.__enumeratePlacableTilesWithinSpecifiedSpaces(u, unit, n));
            env.debug(`${unit.nameWithGroup}が移動可能な${u.nameWithGroup}の周囲${n}以内のマス: ${SetUtil.toString(tileSet)}`);
            resultSet = SetUtil.union(resultSet, tileSet);
        }
        return resultSet;
    }
}

const TARGETS_PLACABLE_SPACES_WITHIN_N_SPACES_FROM_UNITS_NODE =
    (n, units) => new TargetsPlacableSpacesWithinNSpacesFromUnitsNode(n, units);

class SkillOwnerPlacableSpacesWithinNSpacesFromSpaceNode extends TargetsPlacableSpacesWithinNSpacesFromSpaceNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const SKILL_OWNER_PLACABLE_SPACES_WITHIN_N_SPACES_FROM_SPACE_NODE =
    (n, spacesNode) => new SkillOwnerPlacableSpacesWithinNSpacesFromSpaceNode(n, spacesNode);

class CrossSpacesNode extends SpacesNode {
    evaluate(env) {
        let targetTile = env.tile;
        let isInRange = tile => tile.calculateDistance(targetTile) <= 1;
        return env.battleMap.enumerateTiles(isInRange);
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

const GRANTS_STATS_PLUS_AT_START_OF_TURN_NODE =
    (atk, spd, def, res) => new GrantsStatsPlusAtStartOfTurnNode(atk, spd, def, res);

class GrantsStatsPlusToTargetOnMapNode extends ApplyingNumberToEachStatNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let amounts = this.evaluateChildren(env);
        env.debug(`${unit.nameWithGroup}にバフ予約: [${amounts}]`);
        unit.reserveToApplyBuffs(...amounts);
    }
}

const GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE =
    (atk, spd, def, res) => new GrantsStatsPlusToTargetOnMapNode(atk, spd, def, res);

const GRANTS_ATK_TO_TARGET_ON_MAP_NODE =
    atk => new GrantsStatsPlusToTargetOnMapNode(atk, 0, 0, 0);

const GRANTS_ATK_SPD_TO_TARGET_ON_MAP_NODE =
    (atk, spd = atk) => new GrantsStatsPlusToTargetOnMapNode(atk, spd, 0, 0);
const GRANTS_ATK_DEF_TO_TARGET_ON_MAP_NODE =
    (atk, def = atk) => new GrantsStatsPlusToTargetOnMapNode(atk, 0, def, 0);
const GRANTS_ATK_RES_TO_TARGET_ON_MAP_NODE =
    (atk, res = atk) => new GrantsStatsPlusToTargetOnMapNode(atk, 0, 0, res);
const GRANTS_SPD_DEF_TO_TARGET_ON_MAP_NODE =
    (spd, def = spd) => new GrantsStatsPlusToTargetOnMapNode(0, spd, def, 0);
const GRANTS_DEF_RES_TO_TARGET_ON_MAP_NODE =
    (atk, def = atk) => new GrantsStatsPlusToTargetOnMapNode(atk, 0, def, 0);

const GRANTS_ALL_BONUSES_TO_TARGET_ON_MAP_NODE = n =>
    X_NUM_NODE(
        GRANTS_STATS_PLUS_TO_TARGET_ON_MAP_NODE(READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE, READ_NUM_NODE),
        NumberNode.makeNumberNodeFrom(n),
    );

class GrantsStatsPlusToSkillOwnerOnMapNode extends GrantsStatsPlusToTargetOnMapNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const GRANTS_STATS_PLUS_TO_SKILL_OWNER_ON_MAP_NODE =
    (atk, spd, def, res) => new GrantsStatsPlusToSkillOwnerOnMapNode(atk, spd, def, res);

class GrantsStatsPlusToAssistTargetingOnMapNode extends GrantsStatsPlusToTargetOnMapNode {
    static {
        Object.assign(this.prototype, GetAssistTargetingMixin);
    }
}

const GRANTS_STATS_PLUS_TO_ASSIST_TARGETING_ON_MAP_NODE =
    (atk, spd, def, res) => new GrantsStatsPlusToAssistTargetingOnMapNode(atk, spd, def, res);

class InflictsStatsMinusOnTargetOnMapNode extends ApplyingNumberToEachStatNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let amounts = this.evaluateChildren(env).map(v => -v);
        env.debug(`${unit.nameWithGroup}にデバフ予約: [${amounts}]`);
        unit.reserveToApplyDebuffs(...amounts);
    }
}

const INFLICTS_STATS_MINUS_ON_TARGET_ON_MAP_NODE =
    (...stats) => new InflictsStatsMinusOnTargetOnMapNode(...stats);

const INFLICTS_SPD_RES_ON_TARGET_ON_MAP_NODE =
    (spd, res = spd) => new InflictsStatsMinusOnTargetOnMapNode(0, spd, 0, res);
const INFLICTS_ATK_SPD_ON_TARGET_ON_MAP_NODE =
    (atk, spd = atk) => new InflictsStatsMinusOnTargetOnMapNode(atk, spd, 0, 0);
const INFLICTS_ATK_DEF_ON_TARGET_ON_MAP_NODE =
    (atk, def = atk) => new InflictsStatsMinusOnTargetOnMapNode(atk, 0, def, 0);
const INFLICTS_ATK_RES_ON_TARGET_ON_MAP_NODE =
    (atk, res = atk) => new InflictsStatsMinusOnTargetOnMapNode(atk, 0, 0, res);

class InflictsStatsMinusAtStartOfTurnNode extends ApplyingNumberToEachStatNode {
    evaluate(env) {
        let unit = env.target;
        let amounts = this.evaluateChildren(env).map(v => -v);
        env.debug(`${unit.nameWithGroup}にデバフ予約: [${amounts}]`);
        unit.reserveToApplyDebuffs(...amounts);
    }
}

const INFLICTS_STATS_MINUS_AT_START_OF_TURN_NODE =
    (atk, spd, def, res) => new InflictsStatsMinusAtStartOfTurnNode(atk, spd, def, res);

class InflictsStatsMinusAfterCombatNode extends InflictsStatsMinusAtStartOfTurnNode {
}

class GrantsStatusEffectsOnTargetOnMapNode extends FromNumbersNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        this.evaluateChildren(env).forEach(e => {
            let unit = this.getUnit(env);
            env.debug(`${unit.nameWithGroup}に${getStatusEffectName(e)}を付与予約`);
            unit.reserveToAddStatusEffect(e);
        });
    }
}

const GRANTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE =
    (...statusEffects) => new GrantsStatusEffectsOnTargetOnMapNode(...statusEffects);

class InflictsStatusEffectsOnTargetOnMapNode extends GrantsStatusEffectsOnTargetOnMapNode {
}

const INFLICTS_STATUS_EFFECTS_ON_TARGET_ON_MAP_NODE = (...es) => new InflictsStatusEffectsOnTargetOnMapNode(...es);

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

const GRANTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE =
    (...statusEffects) => new GrantsStatusEffectsAtStartOfTurnNode(...statusEffects);

class GrantsStatusEffectsAfterCombatNode extends GrantsStatusEffectsAtStartOfTurnNode {
}

class InflictsStatusEffectsAtStartOfTurnNode extends GrantsStatusEffectsAtStartOfTurnNode {
}

const INFLICTS_STATUS_EFFECTS_AT_START_OF_TURN_NODE =
    (...effects) => new InflictsStatusEffectsAtStartOfTurnNode(...effects);

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

const GRANTS_SPECIAL_COOLDOWN_COUNT_MINUS_ON_TARGET_ON_MAP_NODE =
    n => new GrantsSpecialCooldownCountMinusOnTargetOnMapNode(n);

class GrantsSpecialCooldownCountMinusOnTargetAfterCombatNode extends GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode {
}

// TODO: rename
// skill text: grants Special cooldown count-1
class GrantsSpecialCooldownCountMinusOnTargetNode extends GrantsSpecialCooldownCountMinusOnTargetAtStartOfTurnNode {
}

class GrantsSpecialCooldownCountMinusNToTargetBeforeSpecialTriggersBeforeCombatNode extends GrantsSpecialCooldownCountMinusOnTargetNode {
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

const DEALS_DAMAGE_TO_TARGET_AT_START_OF_TURN_NODE = n => new DealsDamageToTargetAtStartOfTurnNode(n);
const DEALS_DAMAGE_TO_TARGET_ON_MAP_NODE = n => new DealsDamageToTargetAtStartOfTurnNode(n);

// 再行動・再移動
class GrantsAnotherActionNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.grantsAnotherActionOnMap();
        env.debug(`${unit.nameWithGroup}は再行動`);
    }
}

const GRANTS_ANOTHER_ACTION_NODE = new GrantsAnotherActionNode();

class GrantsAnotherActionToTargetOnMapNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.grantsAnotherActionOnMap();
        env.debug(`${unit.nameWithGroup}は行動可能な状態になる`);
    }
}

const GRANTS_ANOTHER_ACTION_TO_TARGET_ON_MAP_NODE = new GrantsAnotherActionToTargetOnMapNode();

class ReEnablesCantoToTargetOnMapNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        env.debug(`${unit.nameWithGroup}は再移動を再発動可能になる`);
        unit.reEnablesCantoOnMap();
    }
}

const RE_ENABLES_CANTO_TO_TARGET_ON_MAP_NODE = new ReEnablesCantoToTargetOnMapNode();

class ReEnablesCantoToAssistTargetOnMapNode extends ReEnablesCantoToTargetOnMapNode {
    static {
        Object.assign(this.prototype, GetAssistTargetMixin);
    }
}

const RE_ENABLES_CANTO_TO_ASSIST_TARGET_ON_MAP_NODE = new ReEnablesCantoToAssistTargetOnMapNode();

class GrantsAnotherActionToTargetOnAssistNode extends SkillEffectNode {
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

const GRANTS_ANOTHER_ACTION_ON_ASSIST_NODE = new GrantsAnotherActionToTargetOnAssistNode();

class GrantsAnotherActionToAssistTargetingOnAssistNode extends GrantsAnotherActionToTargetOnAssistNode {
    static {
        Object.assign(this.prototype, GetAssistTargetingMixin);
    }
}

const GRANTS_ANOTHER_ACTION_TO_ASSIST_TARGETING_ON_ASSIST_NODE = new GrantsAnotherActionToAssistTargetingOnAssistNode();

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

const IS_TARGETS_SPECIAL_COOLDOWN_COUNT_IS_AT_ITS_MAXIMUM_NODE =
    new IsTargetsSpecialCooldownCountIsAtItsMaximumNode();

class TargetsSpecialCooldownCountOnMapNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.specialCount;
        env.debug(`${unit.nameWithGroup}の奥義カウント: ${result}`);
        return result;
    }
}

const TARGETS_SPECIAL_COOLDOWN_COUNT_ON_MAP_NODE = new TargetsSpecialCooldownCountOnMapNode();

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

const IS_TARGET_TRANSFORMED_NODE = new IsTargetTransformedNode();

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

class IsCantoSingDanceActivatedByTargetNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isOneTimeActionActivatedForCantoRefresh;
        env.debug(`${unit.nameWithGroup}はこのターン再移動【歌う・踊る】を発動したか: ${result}`);
        return result;
    }
}

class TargetsBonusesNode extends StatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit === env.unitDuringCombat ?
            unit.getBuffsInCombat(env.getFoeDuringCombatOf(unit)) : unit.getBuffsInPreCombat();
        env.debug(`${unit.nameWithGroup}の強化: ${result}`);
        return result;
    }
}

const TARGETS_BONUSES_NODE = new TargetsBonusesNode();

/**
 * total bonuses
 */
class TargetsTotalBonusesNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        /** @type {Unit} */
        let unit = this.getUnit(env);
        let result = unit === env.unitDuringCombat ?
            unit.getBuffTotalInCombat(env.getFoeDuringCombatOf(unit)) : unit.getBuffTotalInPreCombat();
        env.debug(`${unit.nameWithGroup}の強化の合計値: ${result}`);
        return result;
    }
}

const TARGETS_TOTAL_BONUSES_NODE = new TargetsTotalBonusesNode();

class TargetsBonusNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} indexNode
     */
    constructor(indexNode) {
        super();
        this._indexNode = NumberNode.makeNumberNodeFrom(indexNode);
    }

    evaluate(env) {
        /** @type {Unit} */
        let unit = this.getUnit(env);
        let index = this._indexNode.evaluate(env);
        let result = unit === env.unitDuringCombat ?
            unit.getBuffsInCombat(env.getFoeDuringCombatOf(unit))[index] : unit.getBuffsInPreCombat()[index];
        env.debug(`${unit.nameWithGroup}の強化の値: ${result}(${statusIndexStr(index)})`);
        return result;
    }
}

class FoesBonusNode extends TargetsBonusNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const FOES_BONUS_NODE = index => new FoesBonusNode(index);

class TargetsPenaltyNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} indexNode
     */
    constructor(indexNode) {
        super();
        this._indexNode = NumberNode.makeNumberNodeFrom(indexNode);
    }

    evaluate(env) {
        /** @type {Unit} */
        let unit = this.getUnit(env);
        let index = this._indexNode.evaluate(env);
        let result = unit.getDebuffsInCombat()[index];
        env.debug(`${unit.nameWithGroup}の弱化の値: ${result}(${statusIndexStr(index)})`);
        return result;
    }
}

const TARGETS_PENALTY_NODE = index => new TargetsPenaltyNode(index);

/**
 * neutralizes stat penalties
 */
class NeutralizesTargetsStatPenaltiesNode extends FromBoolStatsNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.reservedDebuffFlagsToNeutralize = this.evaluateChildren(env).slice(0, 4);
        let result = unit.reservedDebuffFlagsToNeutralize;
        env.debug(`${unit.nameWithGroup}は弱化を解除予約: ${result}`);
    }
}

const NEUTRALIZES_TARGETS_ALL_STAT_PENALTIES_NODE =
    new NeutralizesTargetsStatPenaltiesNode(true, true, true, true);

/**
 * neutralizes n 【Penalty】 effects
 * (does not apply to Penalty effects that are applied at the same time;
 * neutralizes the first applicable Penalty effects on unit's list of active effects).
 */
class NeutralizesTargetsNPenaltyEffectsNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let getValue = k => NEGATIVE_STATUS_EFFECT_ORDER_MAP.get(k) ?? Number.MAX_SAFE_INTEGER;
        let effects = unit.getNegativeStatusEffects().sort((a, b) => getValue(a) - getValue(b));
        env.debug(`${unit.nameWithGroup}の現在の不利なステータス: ${effects.map(e => getStatusEffectName(e))}`);

        let n = this.evaluateChildren(env);
        let result = unit.reservedNegativeStatusEffectCountInOrder += n;
        env.debug(`${unit.nameWithGroup}は不利な状態を上位${n}個解除: ${result - n} -> ${result}`);
    }
}

class NeutralizesTargetsNBonusEffectsNode extends FromPositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let getValue = k => POSITIVE_STATUS_EFFECT_ORDER_MAP.get(k) ?? Number.MAX_SAFE_INTEGER;
        let effects = unit.getPositiveStatusEffects().sort((a, b) => getValue(a) - getValue(b));
        env.debug(`${unit.nameWithGroup}の現在の有利なステータス: ${effects.map(e => getStatusEffectName(e))}`);

        let n = this.evaluateChildren(env);
        let result = unit.reservedPositiveStatusEffectCountInOrder += n;
        env.debug(`${unit.nameWithGroup}は有利な状態を上位${n}個解除: ${result - n} -> ${result}`);
    }
}

const NEUTRALIZES_TARGETS_N_BONUS_EFFECTS_NODE = n => new NeutralizesTargetsNBonusEffectsNode(n);

class TargetsOncePerTurnSkillEffectNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {string} id
     * @param {...SkillEffectNode} nodes
     */
    constructor(id, ...nodes) {
        super(...nodes);
        this._id = id;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        if (!unit.oneTimeActionPerTurnActivatedSet.has(this._id)) {
            unit.oneTimeActionPerTurnActivatedSet.add(this._id);
            env.debug(`${unit.nameWithGroup}は1ターン1回のスキル効果（${this._id}）をこのターン初めて発動`);
            return this.evaluateChildren(env);
        } else {
            env.debug(`${unit.nameWithGroup}は1ターン1回のスキル効果（${this._id}）を発動済み`);
        }
    }
}

const TARGETS_ONCE_PER_TURN_SKILL_EFFECT_NODE = (id, ...nodes) =>
    new TargetsOncePerTurnSkillEffectNode(id, ...nodes);

class TargetsOncePerTurnSkillEffectForEntireMapNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(id, ...nodes) {
        super(...nodes);
        this._id = id;
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let skillIdSet = g_appData.globalBattleContext.oncePerTurnSkillsForTheEntireMapInCurrentTurn[unit.groupId];
        if (!skillIdSet.has(this._id)) {
            skillIdSet.add(this._id);
            env.debug(`${unit.nameWithGroup}はマップ全体で1ターン1回のスキル効果（${this._id}）をこのターン初めて発動`);
            return this.evaluateChildren(env);
        } else {
            env.debug(`${unit.nameWithGroup}はマップ全体で1ターン1回のスキル効果（${this._id}）を発動済み`);
        }
    }
}

const TARGETS_ONCE_PER_TURN_SKILL_EFFECT_FOR_ENTIRE_MAP_NODE = (id, ...nodes) =>
    new TargetsOncePerTurnSkillEffectForEntireMapNode(id, ...nodes);

class TargetsRestSupportSkillAvailableTurnNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {...SkillEffectNode} nodes
     */
    constructor(n, ...nodes) {
        super(...nodes);
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    evaluate(env) {
        let unit = env.target;
        let n = this._nNode.evaluate(env);
        if (unit.restSupportSkillAvailableTurn === 0) {
            env.debug(`${unit.nameWithGroup}の補助スキル効果が発動`);
            this.evaluateChildren(env);
            unit.restSupportSkillAvailableTurn = n;
        } else {
            env.debug(`${unit.nameWithGroup}の補助スキル効果発動可能ターンまであと${unit.restSupportSkillAvailableTurn}ターン`);
        }
    }
}

const TARGETS_REST_SUPPORT_SKILL_AVAILABLE_TURN_NODE =
    (n, ...nodes) => new TargetsRestSupportSkillAvailableTurnNode(n, ...nodes);

class TargetsRestSpecialSkillAvailableTurnNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    /**
     * @param {number|NumberNode} n
     * @param {...SkillEffectNode} nodes
     */
    constructor(n, ...nodes) {
        super(...nodes);
        this._nNode = NumberNode.makeNumberNodeFrom(n);
    }

    evaluate(env) {
        let unit = env.target;
        let n = this._nNode.evaluate(env);
        if (unit.restSpecialSkillAvailableTurn === 0) {
            env.debug(`${unit.nameWithGroup}の奥義スキル効果が発動`);
            this.evaluateChildren(env);
            unit.restSpecialSkillAvailableTurn = n;
        } else {
            env.debug(`${unit.nameWithGroup}の奥義スキル効果発動可能ターンまであと${unit.restSpecialSkillAvailableTurn}ターン`);
        }
    }
}

const TARGETS_REST_SPECIAL_SKILL_AVAILABLE_TURN_NODE =
    (n, ...nodes) => new TargetsRestSpecialSkillAvailableTurnNode(n, ...nodes);

class HasTargetPerformedActionNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isActionDone;
        env.debug(`${unit.nameWithGroup}は行動終了しているか: ${result}`);
        return result;
    }
}

const HAS_TARGET_PERFORMED_ACTION_NODE = new HasTargetPerformedActionNode();

class EndsTargetImmediatelyNode extends SkillEffectNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        unit.endActionBySkillEffect();
        env.debug(`${unit.nameWithGroup}はスキル効果により行動終了`);
    }
}

const ENDS_TARGET_IMMEDIATELY_BY_SKILL_NODE = new EndsTargetImmediatelyNode();

class TargetsTitleSetNode extends SetNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.getTitleSet();
        env.debug(`${unit.nameWithGroup}の出典の種類: {${[...result].join(", ")}}`);
        return result;
    }
}

const TARGETS_TITLE_SET_NODE = new TargetsTitleSetNode();

class IsTargetEngagedNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.hasEmblemHero();
        env.debug(`${unit.nameWithGroup}はエンゲージしているか: ${result}`);
        return result;
    }
}

const IS_TARGET_ENGAGED_NODE = new IsTargetEngagedNode();

class IsFoeEngagedNode extends IsTargetEngagedNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const IS_FOE_ENGAGED_NODE = new IsFoeEngagedNode();

class TargetRestStyleSkillAvailableTurnNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.restStyleSkillAvailableTurn;
        env.debug(`${unit.nameWithGroup}はスタイル再発動まで後${result}ターン`);
        return result;
    }
}

const TARGET_REST_STYLE_SKILL_AVAILABLE_TURN_NODE = new TargetRestStyleSkillAvailableTurnNode();

class SetTargetRestStyleSkillAvailableTurnNode extends FromNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.restStyleSkillAvailableTurn = this.evaluateChildren(env);
        env.debug(`${unit.nameWithGroup}はスタイル再発動まで後${result}ターン`);
    }
}

const SET_TARGET_REST_STYLE_SKILL_AVAILABLE_TURN_NODE = (n) => new SetTargetRestStyleSkillAvailableTurnNode(n);

class HasTargetAttackedNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isAttackDone;
        env.debug(`${unit.nameWithGroup}はこのターン攻撃を行ったか: ${result}`);
        return result;
    }
}

const HAS_TARGET_ATTACKED_NODE = new HasTargetAttackedNode();

class HasTargetBeenAttackedNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isAttackedDone;
        env.debug(`${unit.nameWithGroup}はこのターン攻撃をされたか: ${result}`);
        return result;
    }
}

const HAS_TARGET_BEEN_ATTACKED_NODE = new HasTargetBeenAttackedNode();

class IsAnotherActionByAssistActivatedInCurrentTurnOnTargetsTeamNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = g_appData.globalBattleContext.isAnotherActionByAssistActivatedInCurrentTurn[unit.groupId];
        env.debug(`${unit.nameWithGroup}の軍はこのターンすでにアシストによる再行動を発動済みか？: ${result}`);
        return result;
    }
}

const IS_ANOTHER_ACTION_BY_ASSIST_ACTIVATED_IN_CURRENT_TURN_ON_TARGETS_TEAM_NODE =
    new IsAnotherActionByAssistActivatedInCurrentTurnOnTargetsTeamNode();

class IsAnotherActionByAssistActivatedInCurrentTurnOnSkillOwnerTeamNode extends IsAnotherActionByAssistActivatedInCurrentTurnOnTargetsTeamNode {
    static {
        Object.assign(this.prototype, GetSkillOwnerMixin);
    }
}

const IS_ANOTHER_ACTION_BY_ASSIST_ACTIVATED_IN_CURRENT_TURN_ON_SKILL_OWNER_TEAM_NODE =
    new IsAnotherActionByAssistActivatedInCurrentTurnOnSkillOwnerTeamNode();

function getSkillLogLevel() {
    if (typeof g_appData === 'undefined') {
        return LoggerBase.LOG_LEVEL.OFF;
    }
    return g_appData?.skillLogLevel ?? LoggerBase.LOG_LEVEL.OFF;
}

class CanActivateAttackerSpecialNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        env.debug(`アタッカーは奥義を発動することができるか: ${env.canActivateAttackerSpecial}`);
        return env.canActivateAttackerSpecial;
    }
}

const CAN_ACTIVATE_ATTACKER_SPECIAL_NODE = new CanActivateAttackerSpecialNode();

class IsTargetActionDoneDuringMoveCommandNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.isActionDoneDuringMoveCommand;
        env.debug(`${unit.nameWithGroup}はこの移動中行動終了したか: ${result}`);
        return result;
    }
}

const IS_TARGET_ACTION_DONE_DURING_MOVE_COMMAND_NODE = new IsTargetActionDoneDuringMoveCommandNode();

class IsTargetsTeamsMiracleWithoutSpecialActivatedOnCurrentTurnNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let dcw = env.damageCalculatorWrapper;
        if (!dcw) {
            env.error('DamageCalculatorWrapperがありません。');
        }
        let result = dcw.globalBattleContext.isMiracleWithoutSpecialActivatedInCurrentTurn(unit.groupId);
        env.debug(`${unit.nameWithGroup}の軍の奥義以外の祈りがこのターン発動したか: ${result}`);
        return result;
    }
}

const IS_TARGETS_TEAMS_MIRACLE_WITHOUT_SPECIAL_ACTIVATED_ON_CURRENT_TURN_NODE =
    new IsTargetsTeamsMiracleWithoutSpecialActivatedOnCurrentTurnNode();

class IsTargetsFirstAttackNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let context = env.damageCalcContext;
        if (context) {
            let result = context.isFirstAttack(unit);
            env.debug(`${unit.nameWithGroup}の最初の攻撃か: ${result}`);
            return result;
        } else {
            env.error('コンテキストがありません。');
        }
    }
}

const IS_TARGETS_FIRST_ATTACK_NODE = new IsTargetsFirstAttackNode()

class IsFoeFirstAttackNode extends IsTargetsFirstAttackNode {
    static {
        Object.assign(this.prototype, GetFoeDuringCombatMixin);
    }
}

const IS_FOE_FIRST_ATTACK_NODE = new IsFoeFirstAttackNode();

class IsTargetsFollowUpOrPotentFollowUpAttackNode extends BoolNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let context = env.damageCalcContext;
        if (context) {
            let result = context.isFollowupOrPotentFollowupAttack();
            env.debug(`${unit.nameWithGroup}の追撃か: ${result}`);
            return result;
        } else {
            env.error('コンテキストがありません。');
        }
    }
}

const IS_TARGETS_FOLLOW_UP_OR_POTENT_FOLLOW_UP_ATTACK_NODE = new IsTargetsFollowUpOrPotentFollowUpAttackNode();

class ForEachTargetsFoeWithinNSpacesOfUnitAnyOfTheNearestSpacesThatAreMSpacesAwayFromThatFoeNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n, m) {
        super();
        this._n = NumberNode.makeNumberNodeFrom(n);
        this._m = NumberNode.makeNumberNodeFrom(m);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._n.evaluate(env);
        let m = this._m.evaluate(env);
        return env.battleMap.enumerateNearestTileForEachEnemyWithinSpecificSpaces(unit, n, m);
    }
}

const FOR_EACH_TARGETS_FOE_WITHIN_N_SPACES_OF_UNIT_ANY_OF_THE_NEAREST_SPACES_THAT_ARE_M_SPACES_AWAY_FROM_THAT_FOE_NODE =
    (n, m) => new ForEachTargetsFoeWithinNSpacesOfUnitAnyOfTheNearestSpacesThatAreMSpacesAwayFromThatFoeNode(n, m);

class SpacesAdjacentToAnyTargetsAllyWithinNSpacesNode extends SpacesNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    constructor(n) {
        super();
        this._n = NumberNode.makeNumberNodeFrom(n);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let n = this._n.evaluate(env);
        let map = env.battleMap;
        let tiles = [];
        for (let ally of map.enumerateUnitsInTheSameGroupWithinSpecifiedSpaces(unit, n)) {
            for (let tile of ally.placedTile.getMovableNeighborTiles(unit, 1, false, true)) {
                if (map.__canWarp(tile, unit)) {
                    tiles.push(tile);
                }
            }
        }
        return tiles;
    }
}

const SPACES_ADJACENT_TO_ANY_TARGETS_ALLY_WITHIN_N_SPACES_NODE =
    n => new SpacesAdjacentToAnyTargetsAllyWithinNSpacesNode(n);

class NSpacesInALineCenteredOnTargetsFoesSpaceOrientedLeftToRightBasedOnTheDirectionTargetIsFacingNode extends SpacesNode {
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
        let foe = env.getFoeDuringCombatOf(unit);
        let n = this._nNode.evaluate(env);
        let battleMap = env.battleMap;
        return new Set(battleMap.enumerateNTilesInALineCenteredOnFoesTiles(unit, foe, n));
    }
}

const N_SPACES_IN_A_LINE_CENTERED_ON_TARGETS_FOES_SPACE_ORIENTED_LEFT_TO_RIGHT_BASED_ON_THE_DIRECTION_TARGET_IS_FACING_NODE =
    n => new NSpacesInALineCenteredOnTargetsFoesSpaceOrientedLeftToRightBasedOnTheDirectionTargetIsFacingNode(n);

class TargetsCurrentStyleNode extends NumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let result = unit.getCurrentStyle();
        env.debug(`${unit.nameWithGroup}の現在のスタイル: ${ObjectUtil.getKeyName(STYLE_TYPE, result)}`);
        return result;
    }
}

const TARGETS_CURRENT_STYLE_NODE = new TargetsCurrentStyleNode();
/**
 * @param style
 * @returns {EqNode}
 * @constructor
 */
const IS_STYLE_ACTIVE = style => EQ_NODE(TARGETS_CURRENT_STYLE_NODE, style);

class NumberOfTimesTargetHasActedOnTheCurrentTurnNotCountingCantoNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluateChildren(env) {
        let unit = this.getUnit(env);
        let result = unit.actionCount;
        env.debug(`${unit.nameWithGroup}の現在のターンでの行動回数: ${result}`);
        return result;
    }
}

const NUMBER_OF_TIMES_TARGET_HAS_ACTED_ON_THE_CURRENT_TURN_NOT_COUNTING_CANTO_NODE =
    new NumberOfTimesTargetHasActedOnTheCurrentTurnNotCountingCantoNode();

class IsInCombatPhaseNode extends BoolNode {
    evaluate(env) {
        let result = env.isInCombatPhase();
        env.trace(`戦闘中であるか: ${result}`);
        return result;
    }
}

const IS_IN_COMBAT_PHASE_NODE = new IsInCombatPhaseNode();

class DistanceBetweenTargetAndTargetsFoeNode extends PositiveNumberNode {
    static {
        Object.assign(this.prototype, GetUnitMixin);
    }

    evaluate(env) {
        let unit = this.getUnit(env);
        let foe = env.getFoeDuringCombatOf(unit);
        let distance = unit.distance(foe);
        env.debug(`${unit.nameWithGroup}と${foe.nameWithGroup}は${distance}マス離れている`);
        return distance;
    }
}

const DISTANCE_BETWEEN_TARGET_AND_TARGETS_FOE_NODE = new DistanceBetweenTargetAndTargetsFoeNode();
