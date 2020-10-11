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
let TileTypeOptions = [];
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

/// ユニットをタイルに配置します。
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
        var splited = value.split(ValueDelimiter);
        var i = 0;
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
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                break;
            case TileType.Trench:
            case TileType.DefensiveTrench:
                for (var key in this._moveWeights) {
                    this._moveWeights[key] = 1;
                }
                this._moveWeights[MoveType.Cavalry] = 3;
                break;
            case TileType.Flier:
                for (var key in this._moveWeights) {
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
                for (var key in this._moveWeights) {
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

    __getTileMoveWeight(unit) {
        if (this.__isForestType() && unit.moveType == MoveType.Infantry && unit.moveCount == 1) {
            // 歩行に1マス移動制限がかかっている場合は森地形のウェイトは通常地形と同じ
            return 1;
        }

        return this._moveWeights[unit.moveType];
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

    calculateUnitMovementCountToThisTile(moveUnit, fromTile = null, inputMaxDepth = -1, ignoresUnits = true, isUnitIgnoredFunc = null) {
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
            isUnitIgnoredFunc
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

            let weight = neighborTile.getMoveWeight(moveUnit, ignoresUnits, ignoresBreakableWalls, isUnitIgnoredFunc);
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
                nextAlreadyTraced, moveUnit, maxDepth, isTargetTileFunc, sortNeighborsFunc, ignoresUnits, ignoresBreakableWalls, isUnitIgnoredFunc,
                currentDepth + 1, nextDistance, closestDistance);

            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }

        return closestDistance;
    }

    getAttackableNeighborTiles(unit, maxDepth,) {
        var result = [];
        this.getNeighborTilesImpl(result, unit, maxDepth, true, false, true);
        return result;
    }
    getMovableNeighborTiles(unit, maxDepth, ignoresUnits = false, ignoreWeightsExceptCanNotReach = false) {
        var result = [];
        result.push(this);
        this.getNeighborTilesImpl(result, unit, maxDepth, false, ignoreWeightsExceptCanNotReach, ignoresUnits);
        return result;
    }
    getNeighborTilesImpl(result, unit, maxDepth, ignoreWeights, ignoreWeightsExceptCanNotReach, ignoresUnits, currentDepth = 0) {
        for (var neighborIndex = 0; neighborIndex < this._neighbors.length; ++neighborIndex) {
            var neighborTile = this._neighbors[neighborIndex];
            var weight = 1;
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

            var nextDepth = currentDepth + weight;
            if (nextDepth > maxDepth) {
                continue;
            }

            result.push(neighborTile);
            if (isObstructTile) {
                continue;
            }

            neighborTile.getNeighborTilesImpl(result, unit, maxDepth, ignoreWeights, ignoreWeightsExceptCanNotReach, ignoresUnits, nextDepth);
        }
    }


    getMoveWeight(unit, ignoresUnits, ignoresBreakableWalls = false, isUnitIgnoredFunc = null) {
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
                for (let tile of this.neighbors) {
                    if (tile.placedUnit != null
                        && tile._placedUnit.groupId != unit.groupId
                        && (
                            (tile.placedUnit.passiveB == PassiveB.ShingunSoshi3 && tile.placedUnit.hpPercentage >= 50)
                            || (tile.placedUnit.passiveS == PassiveS.GoeiNoGuzo && unit.attackRange == 2)
                        )
                    ) {
                        return ObstructTile;
                    }
                }
            }
        }

        var weight = this.__getTileMoveWeight(unit);
        if (weight != CanNotReachTile) {
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
        this.requiredMovementCount = tile.calculateUnitMovementCountToThisTile(unit);
        this.tilePriority = tile.tilePriority;
        this.distanceFromDiagonal = 0;
        this.isPivotRequired = false;

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
                - requiredMovementCount * 50
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
                - requiredMovementCount * 50
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
            + tileTypeWeight * 1000
            - requiredMovementCount * 50
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
            - this.distanceFromDiagonal * 5000
            + tileTypeWeight * 1000
            - requiredMovementCount * 50
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

        this.priorityToAttack =
            defensiveTileWeight * 1000000
            - this.enemyThreat * 100000
            + teleportationRequirementWeight * 5000
            + tileTypeWeight * 1000
            - requiredMovementCount * 50
            + this.tilePriority;
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
