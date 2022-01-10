/// @file
/// @brief Tile クラスとそれに関連するクラスや関数等の定義です。

const TileType = {
    Normal: 0,
    Forest: 1,
    Flier: 2,
    Trench: 3,
    Wall: 4,
    DefensiveTile: 5,
    DefensiveTrench: 6,
    DefensiveForest: 7,
};

function tileTypeToString(type) {
    switch (type) {
        case TileType.Normal: return "通常";
        case TileType.Forest: return "森";
        case TileType.Flier: return "飛行";
        case TileType.Trench: return "溝";
        case TileType.Wall: return "壁";
        case TileType.DefensiveTile: return "防御地形";
        case TileType.DefensiveTrench: return "溝+防御地形";
        case TileType.DefensiveForest: return "森+防御地形";
        default:
            return "不明";
    }
}
const TileTypeOptions = [];
for (let key in TileType) {
    let id = TileType[key];
    if (id == TileType.Wall) {
        continue;
    }
    TileTypeOptions.push({
        id: id,
        text: tileTypeToString(id)
    });
}


const CanNotReachTile = 1000000;
const ObstructTile = 10000; // 進軍阻止されているタイルのウェイト

/**
 * ユニットをタイルに配置します。
 * @param  {Unit} unit
 * @param  {Tile} tile
 */
function setUnitToTile(unit, tile) {
    if (unit.placedTile != null) {
        unit.placedTile.placedUnit = null;
    }
    unit.placedTile = tile;
    if (tile != null) {
        tile.placedUnit = unit;
        unit.setPos(tile.posX, tile.posY);
    }
    else {
        unit.setPos(-1, -1);
    }
}

/// マップを構成するタイルです。
class Tile {
    constructor(px, py) {
        this.posX = px;
        this.posY = py;
        this._type = TileType.Normal;
        this._obj = null;
        this._moveWeights = [];
        this._moveWeights[MoveType.Infantry] = 1;
        this._moveWeights[MoveType.Flying] = 1;
        this._moveWeights[MoveType.Armor] = 1;
        this._moveWeights[MoveType.Cavalry] = 1;
        this._neighbors = [];
        this._placedUnit = null;
        this._tempData = null;
        this._dangerLevel = 0;
        this._allyDangerLevel = 0;
        this._closestDistanceToEnemy = 0;
        this.tilePriority;

        this.isMovableForAlly = false;
        this.isMovableForEnemy = false;
        this.isAttackableForAlly = false;
        this.isAttackableForEnemy = false;

        this.threateningEnemies = [];
        this.threateningAllies = [];

        this.overridesCell = false;
        this.borderColor = "#000000";
        this.borderWidth = "1px";
        this.overrideText = "";

        this.snapshot = null;
    }

    createSnapshot() {
        let tile = new Tile(this.posX, this.posY);
        tile._dangerLevel = this._dangerLevel;
        tile._allyDangerLevel = this._allyDangerLevel;
        this.snapshot = tile;
    }

    __getEvalTile() {
        if (this.snapshot != null) {
            return this.snapshot;
        }
        return this;
    }

    perTurnStatusToString() {
        return "";
    }

    turnWideStatusToString() {
        return this._type + "";
    }

    fromPerTurnStatusString(value) {
    }

    fromTurnWideStatusString(value) {
        let splited = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(splited[i]))) { this._type = Number(splited[i]); ++i; }
    }

    get serialId() {
        return TileCookiePrefix + this.id;
    }

    get id() {
        return `${this.posX}_${this.posY}`;
    }

    get isStructurePlacable() {
        return !(this.type != TileType.Normal || this.obj instanceof BreakableWall || this.obj instanceof Wall);
    }

    isAttackableBySpecifiedGroup(groupId) {
        if (groupId == UnitGroupType.Ally) {
            return this.isAttackableForAlly;
        }
        else {
            return this.isAttackableForEnemy;
        }
    }

    isTreantenedBySpecifiedUnit(unit) {
        return this.threateningAllies.includes(unit) || this.threateningEnemies.includes(unit);
    }

    get isThreatenedByAlly() {
        return this._dangerLevel > 0;
    }
    get isThreatenedByEnemy() {
        return this._allyDangerLevel > 0;
    }

    overrideCell(text, borderWidth, borderColor) {
        this.overridesCell = true;
        this.borderColor = borderColor;
        this.borderWidth = borderWidth;
        this.overrideText = text;
    }

    resetOverriddenCell() {
        this.overridesCell = false;
        this.borderColor = "#000000";
        this.borderWidth = "1px";
        this.overrideText = "";
    }

    get isDefensiveTile() {
        return this.type == TileType.DefensiveTile || this.type == TileType.DefensiveTrench || this.type == TileType.DefensiveForest;
    }

    positionToString() {
        return "(" + this.posX + ", " + this.posY + ")";
    }

    get closestDistanceToEnemy() {
        return this._closestDistanceToEnemy;
    }

    set closestDistanceToEnemy(value) {
        this._closestDistanceToEnemy = value;
    }

    getEnemyThreatFor(groupId) {
        let tile = this.__getEvalTile();
        switch (groupId) {
            case UnitGroupType.Enemy: return tile.dangerLevel;
            case UnitGroupType.Ally: return tile.allyDangerLevel;
            default:
                throw new Error("unexpected group id" + groupId);
        }
    }

    get dangerLevel() {
        return this._dangerLevel;
    }

    get allyDangerLevel() {
        return this._allyDangerLevel;
    }

    resetDangerLevel() {
        this._dangerLevel = 0;
        this._allyDangerLevel = 0;
    }

    increaseDangerLevel() {
        ++this._dangerLevel;
    }

    increaseAllyDangerLevel() {
        ++this._allyDangerLevel;
    }

    setObj(obj) {
        if (obj == null && this.obj != null) {
            this.obj.setPos(-1, -1);
        }

        this.obj = obj;

        if (this.obj != null) {
            this.obj.setPos(this.posX, this.posY);
        }
    }
    /**
     * @param  {Unit} unit
     */
    setUnit(unit) {
        setUnitToTile(unit, this);
    }


    isEmpty() {
        return this.isObjPlacable() && this.isUnitPlacable();
    }

    isObjPlacable() {
        return this._type == TileType.Normal && this._obj == null;
    }

    isObjPlaceableByNature() {
        return this._type == TileType.Normal && !(this._obj instanceof Wall);
    }

    isUnitPlacable() {
        return this.isMovableTile()
            && this._placedUnit == null
            && isMovableForUnit(this._obj);
    }
    isUnitPlacableForUnit(unit) {
        return this.isMovableTileForUnit(unit)
            && this._placedUnit == null
            && isMovableForUnit(this._obj);
    }

    isMovableTile() {
        return (this._type != TileType.Wall);
    }

    isMovableTileForUnit(unit) {
        return this.isMovableTileForMoveType(unit.moveType);
    }

    isMovableTileForMoveType(moveType) {
        return this._moveWeights[moveType] != CanNotReachTile
            && (this._obj == null || this._obj instanceof TrapBase || this._obj instanceof BreakableWall);
    }

    get tempData() {
        return this._tempData;
    }
    set tempData(value) {
        this._tempData = value;
    }

    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
        switch (value) {
            case TileType.Normal:
            case TileType.DefensiveTile:
                for (let key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                break;
            case TileType.Trench:
            case TileType.DefensiveTrench:
                for (let key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                this._moveWeights[MoveType.Cavalry] = 3;
                break;
            case TileType.Flier:
                for (let key in this._moveWeights) {
                    this._moveWeights[key] = CanNotReachTile;
                }
                this._moveWeights[MoveType.Flying] = 1;
                break;
            case TileType.Forest:
            case TileType.DefensiveForest:
                this._moveWeights[MoveType.Cavalry] = CanNotReachTile;
                this._moveWeights[MoveType.Flying] = 1;
                this._moveWeights[MoveType.Armor] = 1;
                this._moveWeights[MoveType.Infantry] = 2;
                break;
            case TileType.Wall:
                for (let key in this._moveWeights) {
                    this._moveWeights[key] = CanNotReachTile;
                }
                break;
            default:
                break;
        }
    }

    __isForestType() {
        return this._type == TileType.Forest || this._type == TileType.DefensiveForest;
    }

    __getTileMoveWeight(unit, isPathfinderEnabled = true) {
        if (isPathfinderEnabled && this.__canActivatePathfinder(unit)) {
            return 0;
        }

        if (this.__isForestType() && unit.moveType == MoveType.Infantry && unit.moveCount == 1) {
            // 歩行に1マス移動制限がかかっている場合は森地形のウェイトは通常地形と同じ
            return 1;
        }

        return this._moveWeights[unit.moveType];
    }

    /// 指定したユニットについて、このタイルで天駆の道が発動するか
    __canActivatePathfinder(unit) {
        if (this._placedUnit == null) {
            return false;
        }

        return this._placedUnit.groupId == unit.groupId
            && this._placedUnit.hasPathfinderEffect();
    }

    get obj() {
        return this._obj;
    }
    set obj(value) {
        if (this._obj != null) {
            this._obj.placedTile = null;
        }
        this._obj = value;
        if (this._obj != null) {
            this._obj.placedTile = this;
        }
    }

    get objType() {
        if (this._obj == null) {
            return ObjType.None;
        }
        return this._obj.type;
    }

    get placedUnit() {
        return this._placedUnit;
    }
    set placedUnit(value) {
        this._placedUnit = value;
    }

    get neighbors() {
        return this._neighbors;
    }

    addNeighbor(cell) {
        this._neighbors.push(cell);
    }

    get moveWeights() {
        return this._moveWeights;
    }

    examinesIsTeleportationRequiredForThisTile(unit) {
        for (let neighborTile of unit.placedTile.getMovableNeighborTiles(unit, unit.moveCount, false)) {
            if (neighborTile == this) {
                return false;
            }
        }
        return true;
    }

    calculateDistanceTo(posX, posY) {
        return Math.abs(this.posX - posX) + Math.abs(this.posY - posY);
    }
    /**
     * @param  {Tile} targetTile
     * @returns {Number}
     */
    calculateDistance(targetTile) {
        return this.calculateDistanceTo(targetTile.posX, targetTile.posY);
    }

    calculateDistanceToUnit(unit) {
        return this.calculateDistance(unit.placedTile);
    }

    calculateDistanceToClosestEnemyTile(moveUnit) {
        let alreadyTraced = [this];
        let maxDepth = this.__getMaxDepth();
        let ignoresBreakableWalls = moveUnit.hasWeapon;
        return this._calculateDistanceToClosestTile(
            alreadyTraced, this.placedUnit, maxDepth,
            tile => {
                return tile._placedUnit != null
                    && tile._placedUnit.groupId != this.placedUnit.groupId;
            },
            neighbors => {
            },
            true,
            ignoresBreakableWalls
        );
    }

    calculateUnitMovementCountToThisTile(
        moveUnit,
        fromTile = null,
        inputMaxDepth = -1,
        ignoresUnits = true,
        isUnitIgnoredFunc = null,
        isPathfinderEnabled = true, // 天駆の道を考慮するか否か
    ) {
        if (fromTile == null) {
            fromTile = moveUnit.placedTile;
        }

        if (fromTile == this) {
            return 0;
        }

        let ignoresBreakableWalls = moveUnit.hasWeapon;
        let alreadyTraced = [fromTile];

        let maxDepth = inputMaxDepth;
        if (maxDepth < 0) {
            maxDepth = this.__getMaxDepth();
        }
        maxDepth = Math.min(this.__getMaxDepth(), maxDepth);
        return fromTile._calculateDistanceToClosestTile(
            alreadyTraced, moveUnit, maxDepth,
            tile => {
                return tile == this;
            },
            neighbors => {
                // 遅くなってしまった
                // let thisTile = this;
                // neighbors.sort(function (a, b) {
                //     return a.calculateDistance(thisTile) - b.calculateDistance(thisTile);
                // });
            },
            ignoresUnits,
            ignoresBreakableWalls,
            isUnitIgnoredFunc,
            isPathfinderEnabled
        );
    }

    __getMaxDepth() {
        // 最大深度が大きいと処理時間に影響するので現実的にありそうな最大にしておく
        return ((8 - 1) + (6 - 1)) + 4;
    }

    _calculateDistanceToClosestTile(
        alreadyTraced,
        moveUnit,
        maxDepth,
        isTargetTileFunc,
        sortNeighborsFunc,
        ignoresUnits = true,
        ignoresBreakableWalls = true,
        isUnitIgnoredFunc = null,
        isPathfinderEnabled = true,
        currentDepth = 0,
        currentDistance = 0,
        closestDistance = CanNotReachTile
    ) {
        let neighbors = this._neighbors;
        sortNeighborsFunc(neighbors);
        for (let neighborTile of neighbors) {
            if (alreadyTraced.includes(neighborTile)) {
                continue;
            }
            alreadyTraced.push(neighborTile);

            let weight = neighborTile.getMoveWeight(
                moveUnit, ignoresUnits, ignoresBreakableWalls, isUnitIgnoredFunc, isPathfinderEnabled);
            if (weight >= CanNotReachTile) {
                // 通行不可
                continue;
            }

            let isObstructTile = weight == ObstructTile;
            if (isObstructTile) {
                // 進軍阻止
                weight = 1;
            }

            let nextDistance = currentDistance + weight;
            if (nextDistance >= closestDistance || nextDistance > maxDepth) {
                // これ以上評価の必要なし
                continue;
            }

            if (isTargetTileFunc(neighborTile)) {
                // 目的のタイルが見つかった
                if (nextDistance < closestDistance) {
                    closestDistance = nextDistance;
                }
                continue;
            }

            if (isObstructTile) {
                continue;
            }

            let nextAlreadyTraced = alreadyTraced.slice(0, alreadyTraced.length);
            let distance = neighborTile._calculateDistanceToClosestTile(
                nextAlreadyTraced,
                moveUnit,
                maxDepth,
                isTargetTileFunc,
                sortNeighborsFunc,
                ignoresUnits,
                ignoresBreakableWalls,
                isUnitIgnoredFunc,
                isPathfinderEnabled,
                currentDepth + 1, nextDistance, closestDistance);

            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }

        return closestDistance;
    }

    getMovableNeighborTiles(unit, maxDepth, ignoresUnits = false, ignoreWeightsExceptCanNotReach = false) {
        let result = [];
        result.push(this);
        let tracedDepthDict = {};
        tracedDepthDict[this.id] = -1;
        this.getNeighborTilesImpl(result, unit, maxDepth, false, ignoreWeightsExceptCanNotReach, ignoresUnits, tracedDepthDict);
        return result;
    }
    getNeighborTilesImpl(
        result,
        unit,
        maxDepth,
        ignoreWeights,
        ignoreWeightsExceptCanNotReach,
        ignoresUnits,
        tracedDepthDict,
        currentDepth = 0
    ) {
        for (let neighborTile of this._neighbors) {
            let key = neighborTile.id;
            let hasKey = key in tracedDepthDict;
            if (hasKey) {
                let oldDepth = tracedDepthDict[key];
                if (oldDepth <= currentDepth) {
                    continue;
                }
            }

            let weight = 1;
            if (ignoreWeights == false) {
                weight = neighborTile.getMoveWeight(unit, ignoresUnits, false);
            }

            let isObstructTile = weight == ObstructTile;
            if (isObstructTile) {
                // 進軍阻止
                weight = 1;
            }

            if (ignoreWeightsExceptCanNotReach) {
                if (weight != CanNotReachTile) {
                    weight = 1;
                }
            }

            if (weight == CanNotReachTile) {
                tracedDepthDict[key] = -1;
            }

            let nextDepth = currentDepth + weight;
            if (nextDepth > maxDepth) {
                continue;
            }

            tracedDepthDict[key] = currentDepth;
            if (!hasKey) {
                result.push(neighborTile);
            }
            if (isObstructTile) {
                continue;
            }

            neighborTile.getNeighborTilesImpl(
                result, unit, maxDepth, ignoreWeights, ignoreWeightsExceptCanNotReach, ignoresUnits,
                tracedDepthDict, nextDepth);
        }
    }

    isEnemyUnitAvailable(moveUnit) {
        return this.placedUnit != null
            && this._placedUnit.groupId != moveUnit.groupId;
    }

    getMoveWeight(unit, ignoresUnits, ignoresBreakableWalls = false, isUnitIgnoredFunc = null, isPathfinderEnabled = true) {
        if (this._placedUnit != null && isUnitIgnoredFunc != null && !isUnitIgnoredFunc(this._placedUnit)) {
            // タイルのユニットを無視しないので障害物扱い
            return CanNotReachTile;
        }

        if (!ignoresUnits) {
            if (!unit.canActivatePass()) {
                if (this._placedUnit != null && unit.groupId != this._placedUnit.groupId) {
                    // 敵ユニットだったらオブジェクトと同じ扱い
                    return CanNotReachTile;
                }

                // 隣接マスに進軍阻止持ちがいるか確認
                for (let tile1Space of this.neighbors) {
                    if (tile1Space.isEnemyUnitAvailable(unit)
                        && tile1Space.placedUnit.canActivateObstractToAdjacentTiles(unit)
                    ) {
                        return ObstructTile;
                    }

                    // 2マス以内に進軍阻止持ちがいるか確認
                    for (let tile2Spaces of tile1Space.neighbors) {
                        if (tile2Spaces.isEnemyUnitAvailable(unit)
                            && tile2Spaces.placedUnit.canActivateObstractToTilesIn2Spaces(unit)
                        ) {
                            return ObstructTile;
                        }
                    }
                }
            }
        }

        let weight = this.__getTileMoveWeight(unit, isPathfinderEnabled);
        if (weight != CanNotReachTile && weight != 0) {
            if (unit.weapon == Weapon.FujinYumi && unit.isWeaponRefined && unit.hpPercentage >= 50) {
                weight = 1;
            }
        }
        if (this._obj == null) {
            return weight;
        }

        if (this._obj instanceof TrapBase) {
            return weight;
        }

        if (ignoresBreakableWalls) {
            if (!this._obj.isBreakable) {
                return CanNotReachTile;
            }

            if (this._obj instanceof BreakableWall) {
                return weight;
            }

            if (unit.groupId == UnitGroupType.Ally) {
                if (this._obj instanceof DefenceStructureBase) {
                    return weight;
                }
            }
            else {
                if (this._obj instanceof OffenceStructureBase) {
                    return weight;
                }
            }
        }

        return CanNotReachTile;
    }
}

/// マスの優先度を評価する際に使用するコンテキストです。
class TilePriorityContext {
    constructor(tile, unit) {
        this.unit = unit;
        this.tile = tile;
        this.isDefensiveTile = tile.isDefensiveTile;
        this.isTeleportationRequired = tile.examinesIsTeleportationRequiredForThisTile(unit);
        this.tileType = tile.type;

        // 教授の資料の movement required は移動力に関係ないただの距離のこと
        this.requiredMovementCount = tile.calculateDistanceToUnit(unit);

        // このマスに辿り着いた時の残りの移動力、ワープマスは0
        this.restMovementPower = 0;
        {
            let requiredMovementPower = tile.calculateUnitMovementCountToThisTile(
                unit,
                unit.placedTile,
                unit.moveCount
            );
            if (requiredMovementPower != CanNotReachTile) {
                this.restMovementPower = unit.getNormalMoveCount() - requiredMovementPower;
            }
        }

        this.tilePriority = tile.tilePriority;
        this.distanceFromDiagonal = 0;
        this.isPivotRequired = false;

        // 攻撃マスの決定に必要
        this.combatResult = CombatResult.Draw;
        this.damageRatio = 0;

        // ブロック破壊可能なタイル
        this.attackableTileContexts = [];
        this.bestTileToBreakBlock = null;

        this.priorityToAssist = 0;
        this.priorityToMove = 0;
        this.priorityToBreakBlock = 0;
        this.priorityOfTargetBlock = 0;
        this.priorityToAttack = 0;
    }

    get enemyThreat() {
        return this.tile.getEnemyThreatFor(this.unit.groupId);
    }

    __calcMinDiaglonalDist(targetTile, mapWidth, mapHeight) {
        let origX = targetTile.posX;
        let origY = targetTile.posY;
        let minDiagonalDist = 1000;
        for (let x = origX, y = origY; x < mapWidth && y < mapHeight; ++x, ++y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x < mapWidth && y >= 0; ++x, --y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x >= 0 && y < mapHeight; --x, ++y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        for (let x = origX, y = origY; x >= 0 && y >= 0; --x, --y) {
            let dist = this.tile.calculateDistanceTo(x, y);
            if (dist < minDiagonalDist) { minDiagonalDist = dist; }
        }
        return minDiagonalDist;
    }

    calcPriorityToAssist(assistUnit) {
        if (assistUnit.supportInfo == null) {
            return;
        }

        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        if (assistUnit.support == Support.Pivot) {
            this.priorityToAssist =
                defensiveTileWeight * 10000000
                - this.enemyThreat * 1000000
                + this.tilePriority;
        }
        else if (assistUnit.supportInfo.assistType == AssistType.Move) {
            let teleportationRequirementWeight = 0;
            let requiredMovementCount = this.requiredMovementCount;
            if (this.isTeleportationRequired) {
                teleportationRequirementWeight = 1;
                requiredMovementCount = 0;
            }
            this.priorityToAssist =
                defensiveTileWeight * 100000
                - this.enemyThreat * 10000
                + teleportationRequirementWeight * 5000
                - requiredMovementCount * 100
                + this.tilePriority;
        }
        else {
            let teleportationRequirementWeight = 0;
            let requiredMovementCount = this.requiredMovementCount;
            if (this.isTeleportationRequired) {
                teleportationRequirementWeight = 1;
                requiredMovementCount = 0;
            }
            let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);
            this.priorityToAssist =
                defensiveTileWeight * 1000000
                - this.enemyThreat * 110000
                + teleportationRequirementWeight * 50000
                + tileTypeWeight * 5000
                - requiredMovementCount * 100
                + this.tilePriority;
        }
    }

    calcPriorityToBreakBlock() {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }
        this.priorityToBreakBlock =
            defensiveTileWeight * 10000000
            - this.enemyThreat * 1000000
            + teleportationRequirementWeight * 500000
            + tileTypeWeight * 2000
            - requiredMovementCount * 100
            + this.tilePriority;
    }

    calcPriorityToMoveByCanto(moveUnit, mapWidth, mapHeight) {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(moveUnit, this.tileType);
        if (moveUnit.moveType == MoveType.Cavalry) {
            // 騎馬はタイル優先度がないっぽい
            // https://twitter.com/lidick_l/status/1338005122882793477?s=20
            tileTypeWeight = 0;
        }

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }

        this.distanceFromDiagonal = this.__calcMinDiaglonalDist(moveUnit.placedTile, mapWidth, mapHeight);

        this.priorityToMove =
            - this.enemyThreat * 10000000
            - this.restMovementPower * 1000000
            + defensiveTileWeight * 100000
            - this.distanceFromDiagonal * 10000
            + tileTypeWeight * 5000
            + teleportationRequirementWeight * 2500
            - requiredMovementCount * 100
            + this.tilePriority;
    }

    calcPriorityToMove(moveUnit, chaseTargetTile, mapWidth, mapHeight) {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let tileTypeWeight = this.__getTileTypePriority(moveUnit, this.tileType);

        let pivotRequiredPriority = 0;
        if (this.isPivotRequired) {
            pivotRequiredPriority = 1;
            this.isTeleportationRequired = false;
        }

        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) { teleportationRequirementWeight = 1; requiredMovementCount = 0; }

        this.distanceFromDiagonal = this.__calcMinDiaglonalDist(chaseTargetTile, mapWidth, mapHeight);

        this.priorityToMove =
            defensiveTileWeight * 10000000
            - this.enemyThreat * 1000000
            + teleportationRequirementWeight * 500000
            - pivotRequiredPriority * 100000
            - this.distanceFromDiagonal * 10000
            + tileTypeWeight * 2000
            - requiredMovementCount * 100
            + this.tilePriority;
    }

    calcPriorityToAttack() {
        let defensiveTileWeight = 0;
        if (this.isDefensiveTile) { defensiveTileWeight = 1; }
        let teleportationRequirementWeight = 0;
        let requiredMovementCount = this.requiredMovementCount;
        if (this.isTeleportationRequired) {
            teleportationRequirementWeight = 1;
            requiredMovementCount = 0;
        }
        let tileTypeWeight = this.__getTileTypePriority(this.unit, this.tileType);
        let combatResultPriority = this.__getCombatResultPriority();

        this.priorityToAttack =
            combatResultPriority * 400000 * 3 * 500 // とりあえず最大500ダメージ想定
            + this.damageRatio * 400000
            + defensiveTileWeight * 200000
            - this.enemyThreat * 20000
            + teleportationRequirementWeight * 10000
            + tileTypeWeight * 2000
            - requiredMovementCount * 100
            - this.tilePriority;
    }

    __getCombatResultPriority() {
        switch (this.combatResult) {
            case CombatResult.Loss: return 0;
            case CombatResult.Draw: return 1;
            case CombatResult.Win: return 2;
        }
    }

    __getTileTypePriority(unit, type) {
        switch (type) {
            case TileType.DefensiveForest:
            case TileType.Forest:
                return 2;
            case TileType.Flier:
                return 3;
            case TileType.DefensiveTrench:
            case TileType.Trench:
                if (unit.moveType == MoveType.Cavalry) {
                    return 1;
                }
                else {
                    return 0;
                }
            case TileType.Wall: return 0;
            case TileType.DefensiveTile: return 0;
            case TileType.Normal: return 0;
            default: return 0;
        }
    }
}
