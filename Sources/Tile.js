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
    TileTypeOptions.push({
        id: id,
        text: tileTypeToString(id)
    });
}


const CanNotReachTile = 1000000;
const ObstructTile = 10000; // 進軍阻止されているタイルのウェイト

// 天脈追加
// DivineVeinTypeに追加
// DIVINE_VEIN_NAMESに追加
// getDivineVeinImgPathに追加
// 画像ファイルを追加(https://feheroes.fandom.com/wiki/Divine_Vein#Gallery)
// 氷系の場合はbreakDivineVein(), hasBreakableDivineVein()に追加
const DivineVeinType = {
    None: 0,
    Stone: 1,
    Flame: 2,
    Green: 3,
    Haze: 4,
    Water: 5,
    Ice: 6,
    Icicle: 7,
    Vert: 8,
};
const DIVINE_VEIN_NAMES = ['', '護', '炎', '緑', '瘴', '水', '氷', '深緑氷', '深緑'];
function getDivineVeinName(divineVein) {
    return DIVINE_VEIN_NAMES[divineVein] ?? 'なし';
}

const DIVINE_VEIN_ICE_TYPES = new Set([
    DivineVeinType.Ice,
    DivineVeinType.Icicle
]);

const DIVINE_VEIN_GREEN_TYPES = new Set([
    DivineVeinType.Green,
    DivineVeinType.Vert
]);

function divineVeinColor(divineVeinGroup) {
    switch (divineVeinGroup) {
        case UnitGroupType.Ally:
            return "#00bbff";
        case UnitGroupType.Enemy:
            return "#ff8800";
    }
}

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
    } else {
        unit.setPos(-1, -1);
    }
}

/// マップを構成するタイルです。
class Tile extends BattleMapElement {
    constructor(px, py) {
        super();
        this.posX = px;
        this.posY = py;
        this._type = TileType.Normal;
        /** @type {BattleMapElement} */
        this._obj = null;
        this._moveWeights = [];
        this._moveWeights[MoveType.Infantry] = 1;
        this._moveWeights[MoveType.Flying] = 1;
        this._moveWeights[MoveType.Armor] = 1;
        this._moveWeights[MoveType.Cavalry] = 1;

        /** @type {Tile[]} */
        this._neighbors = [];
        this._placedUnit = null;
        this._tempData = null;
        this._dangerLevel = 0;
        this._allyDangerLevel = 0;
        this._closestDistanceToEnemy = 0;
        this.tilePriority;
        /** @type {BattleMap} */
        this.battleMap = null
        /** @type {Record<number, Tile[]>} */
        this._neighborsWithin = {};
        /** @type {Record<number, Tile[]>} */
        this._neighborsAt = {};

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

        this.divineVein = DivineVeinType.None;
        this.reservedDivineVeinSet = new Set();
        this.divineVeinGroup = null;
        this.reservedDivineVeinGroup = null;
        this.divineVeinTurns = 0;
        this.reservedDivineVeinTurns = 0;

        /** @type {Tile} */
        this.snapshot = null;
    }

    toString() {
        return `Tile(${this.posX}, ${this.posY})`;
    }

    toPlacedUnitString() {
        let unit = this.placedUnit;
        if (unit == null) {
            return this.toString();
        } else {
            return `${unit.nameWithGroup}(${this.posX}, ${this.posY})`;
        }
    }

    isInXRange(fromX, toX) {
        return fromX <= this.posX && this.posX <= toX;
    }

    isInYRange(fromY, toY) {
        return fromY <= this.posY && this.posY <= toY;
    }

    isInRange(fromX, toX, fromY, toY) {
        return this.isInXRange(fromX, toX) && this.isInYRange(fromY, toY);
    }

    // 天脈の予約を行う
    reserveDivineVein(divineVein, divineVeinGroup, turns = 1) {
        if (this.cannotApplyDivineVein()) return;
        this.reservedDivineVeinSet.add(divineVein);
        this.reservedDivineVeinGroup = divineVeinGroup;
        this.reservedDivineVeinTurns = turns;
    }

    createSnapshot() {
        let tile = new Tile(this.posX, this.posY);
        tile._dangerLevel = this._dangerLevel;
        tile._allyDangerLevel = this._allyDangerLevel;
        this.snapshot = tile;
    }
    /**
     * @returns {Tile}
     */
    __getEvalTile() {
        if (this.snapshot != null) {
            return this.snapshot;
        }
        return this;
    }

    perTurnStatusToString() {
        return this.divineVein + ValueDelimiter +
            this.divineVeinGroup + ValueDelimiter +
            this.divineVeinTurns + ValueDelimiter
            ;
    }

    turnWideStatusToString() {
        return this._type + "";
    }

    fromPerTurnStatusString(value) {
        if (!value) {
            return;
        }
        let values = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(values[i]))) { this.divineVein = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.divineVeinGroup = Number(values[i]); ++i; }
        if (Number.isInteger(Number(values[i]))) { this.divineVeinTurns = Number(values[i]); ++i; }
    }

    fromTurnWideStatusString(value) {
        let values = value.split(ValueDelimiter);
        let i = 0;
        if (Number.isInteger(Number(values[i]))) { this._type = Number(values[i]); ++i; }
    }

    get serialId() {
        return TileCookiePrefix + this.id;
    }

    get id() {
        return `${this.posX}_${this.posY}`;
    }

    get isStructurePlacable() {
        // 画像認識で使用。氷には影響ない
        return !(this.type != TileType.Normal || this.obj instanceof BreakableWall || this.isWall());
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
    /**
     * @returns {String}
     */
    positionToString() {
        return "(" + this.posX + ", " + this.posY + ")";
    }

    get closestDistanceToEnemy() {
        return this._closestDistanceToEnemy;
    }

    set closestDistanceToEnemy(value) {
        this._closestDistanceToEnemy = value;
    }
    /**
     * @param  {UnitGroupType} groupId
     * @param  {Boolean} ignoresSnapshot
     */
    getEnemyThreatFor(groupId, ignoresSnapshot = false) {
        let tile = ignoresSnapshot ? this : this.__getEvalTile();
        switch (groupId) {
            case UnitGroupType.Enemy: return tile.dangerLevel;
            case UnitGroupType.Ally: return tile.allyDangerLevel;
            default:
                throw new Error("unexpected group id" + groupId);
        }
    }

    /**
     * @returns {Number}
     */
    get dangerLevel() {
        return this._dangerLevel;
    }

    /**
     * @returns {Number}
     */
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

    /**
     * @param {Unit} unit
     * @returns {boolean}
     */
    isUnitPlacable(unit) {
        if (unit) {
            return this.isMovableTile()
                && this._placedUnit == null
                && !this.hasEnemyBreakableDivineVein(unit.groupId)
                && isMovableForUnit(this._obj);
        } else {
            return this.isMovableTile()
                && this._placedUnit == null
                && !this.hasBreakableDivineVein()
                && isMovableForUnit(this._obj);
        }
    }

    isUnitPlacableIncludingCurrentTile(unit) {
        return unit.placedTile === this || this.isUnitPlacable(unit);
    }

    /**
     * @param {Unit} unit
     * @returns {boolean}
     */
    isUnitPlacableForUnit(unit) {
        return this.isMovableTileForUnit(unit)
            && this._placedUnit == null
            && !this.hasEnemyBreakableDivineVein(unit.groupId)
            && isMovableForUnit(this._obj);
    }

    isMovableTile() {
        return this._type !== TileType.Wall;
    }

    isMovableTileForUnit(unit) {
        return this.isMovableTileForMoveType(unit.moveType, unit.groupId);
    }

    // TODO: なぜBreakableWallが条件になっているのか調べる
    // とりあえずはBreakableDivineVeinも同じように判定する
    isMovableTileForMoveType(moveType, groupId) {
        if (this._moveWeights[moveType] === CanNotReachTile) {
            return false;
        }
        if (this.hasEnemyBreakableDivineVein(groupId)) {
            return false;
        }
        return this._obj == null ||
            this._obj instanceof TileTypeStructureBase ||
            this._obj instanceof BreakableWall;
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
        return this._type === TileType.Forest || this._type === TileType.DefensiveForest;
    }

    __getTileMoveWeight(unit, ignoreBreakableWalls, isPathfinderEnabled = true) {
        // 天脈・氷(敵)の場合は通れない
        if (!ignoreBreakableWalls) {
            if (this.hasEnemyBreakableDivineVein(unit.groupId)) {
                return CanNotReachTile;
            }
        }

        if (isPathfinderEnabled && this.__canActivatePathfinder(unit) &&
            this._moveWeights[unit.moveType] !== CanNotReachTile) {
            return 0;
        }

        if (this.__isForestType() && unit.moveType === MoveType.Infantry &&
            unit.moveCount === 1 && !unit.isCantoActivating) {
            // 歩行に1マス移動制限がかかっている場合は森地形のウェイトは通常地形と同じ
            // 再移動中は残り移動距離1に対する侵入保証は無い
            return 1;
        }

        // 天脈・炎/水の場合は敵の2距離はコスト+1
        // ただし移動制限がかかっている場合は侵入可能
        let isDifficultTerrainDivineVein =
            this.divineVein === DivineVeinType.Flame ||
            this.divineVein === DivineVeinType.Water;
        if (unit.isRangedWeaponType() &&
            isDifficultTerrainDivineVein &&
            this.isEnemyDivineVein(unit)) {
            return unit.moveCount === 1 ? 1 : 2;
        }

        return this._moveWeights[unit.moveType];
    }

    isEnemyDivineVein(unit) {
        return this.divineVeinGroup !== unit.groupId;
    }

    isDivineVeinApplied() {
        return this.divineVein !== DivineVeinType.None;
    }

    /**
     * 指定したユニットについて、このタイルで天駆の道が発動するか
     */
    __canActivatePathfinder(unit) {
        if (this._placedUnit == null) {
            return false;
        }

        return this._placedUnit.groupId === unit.groupId
            && this._placedUnit.hasPathfinderEffect();
    }
    /**
     * @returns {BattleMapElement}
     */
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
    /**
     * @returns {Tile[]}
     */
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

    /**
     * 周囲 n マス以内の Tile 配列を返す（遅延計算 + キャッシュ）
     * @param {number} n
     * @returns {Tile[]}
     */
    getNeighborsWithin(n) {
        if (this._neighborsWithin[n]) {
            return this._neighborsWithin[n];
        }
        const result = [];
        for (let tile of this.battleMap.enumerateTiles()) {
            if (tile.calculateDistanceTo(this) <= n) {
                result.push(tile);
            }
        }
        this._neighborsWithin[n] = result;
        return result;
    }

    /**
     * 周囲 n マスの Tile 配列を返す（遅延計算 + キャッシュ）
     * @param {number} n
     * @returns {Tile[]}
     */
    getNeighborsAtDistanceSpaces(n) {
        if (this._neighborsAt[n]) {
            return this._neighborsAt[n];
        }
        const result = [];
        for (let tile of this.battleMap.enumerateTiles()) {
            if (tile.calculateDistance(this) === n) {
                result.push(tile);
            }
        }
        this._neighborsAt[n] = result;
        return result;
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
        let maxDepth = this.__getMaxDepth();
        // 氷は無視されるので気にしなくて良い
        let ignoresBreakableWalls = moveUnit.hasWeapon;
        return this._calculateDistanceToClosestTile(
            this.placedUnit, maxDepth,
            tile => {
                return tile._placedUnit != null
                    && tile._placedUnit.groupId !== this.placedUnit.groupId;
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

        if (fromTile === this) {
            return 0;
        }

        // 武器がない時には氷に対して処理を行わなければいけないかもしれない
        let ignoresBreakableWalls = moveUnit.hasWeapon;

        let maxDepth = inputMaxDepth;
        if (maxDepth < 0) {
            maxDepth = this.__getMaxDepth();
        }
        maxDepth = Math.min(this.__getMaxDepth(), maxDepth);
        return fromTile?._calculateDistanceToClosestTile(
            moveUnit, maxDepth,
            tile => {
                return tile === this;
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
        ) ?? 0;
    }

    __getMaxDepth() {
        // 最大深度が大きいと処理時間に影響するので現実的にありそうな最大にしておく
        return ((8 - 1) + (6 - 1)) + 4;
    }

    /**
     * 最も近いターゲットタイルまでの距離を、Dijkstra風に計算する。
     *
     * @param {Object} moveUnit
     * @param {number} maxDepth                // 距離の上限
     * @param {(tile: Tile) => boolean} isTargetTileFunc
     * @param {(neighbors: Tile[]) => void} sortNeighborsFunc
     * @param {boolean} [ignoresUnits=true]
     * @param {boolean} [ignoresBreakableWalls=true]
     * @param {((unit: any) => boolean)|null} [isUnitIgnoredFunc=null]
     * @param {boolean} [isPathfinderEnabled=true]
     * @returns {number}                       // 最短距離 or CanNotReachTile
     */
    _calculateDistanceToClosestTile(
        moveUnit,
        maxDepth,
        isTargetTileFunc,
        sortNeighborsFunc,
        ignoresUnits = true,
        ignoresBreakableWalls = true,
        isUnitIgnoredFunc = null,
        isPathfinderEnabled = true
    ) {
        // --------------------
        // 小さな優先度付きキュー
        // --------------------
        class MinHeap {
            constructor() {
                /** @type {{tile: Tile, dist: number}[]} */
                this._buf = [];
            }
            push(node) {
                const buf = this._buf;
                buf.push(node);
                let i = buf.length - 1;
                while (i > 0) {
                    const p = (i - 1) >> 1;
                    if (buf[p].dist <= buf[i].dist) break;
                    [buf[p], buf[i]] = [buf[i], buf[p]];
                    i = p;
                }
            }
            pop() {
                const buf = this._buf;
                if (buf.length === 0) return null;
                const top = buf[0];
                const last = buf.pop();
                if (buf.length > 0 && last) {
                    buf[0] = last;
                    let i = 0;
                    const n = buf.length;
                    // eslint-disable-next-line no-constant-condition
                    while (true) {
                        let l = i * 2 + 1;
                        let r = l + 1;
                        let smallest = i;
                        if (l < n && buf[l].dist < buf[smallest].dist) smallest = l;
                        if (r < n && buf[r].dist < buf[smallest].dist) smallest = r;
                        if (smallest === i) break;
                        [buf[i], buf[smallest]] = [buf[smallest], buf[i]];
                        i = smallest;
                    }
                }
                return top;
            }
            get size() {
                return this._buf.length;
            }
        }

        // ----------------------------------------
        // Dijkstra 風に「距離の短いノードから」順に探索
        // ----------------------------------------

        const heap = new MinHeap();

        /** @type {Map<Tile, number>} 各タイルへ到達した最短距離 */
        const bestDistance = new Map();

        let closestDistance = CanNotReachTile;

        // 開始タイル（this）から探索開始
        bestDistance.set(this, 0);
        heap.push({ tile: this, dist: 0 });

        // 開始タイル自体がターゲットなら 0 で返す
        if (isTargetTileFunc(this)) {
            return 0;
        }

        while (heap.size > 0) {
            const node = heap.pop();
            if (!node) break;

            const currentTile = node.tile;
            const currentDist = node.dist;

            // すでにもっと短い距離で到達しているならスキップ
            const knownBest = bestDistance.get(currentTile);
            if (knownBest !== undefined && currentDist > knownBest) {
                continue;
            }

            // すでに見つかった最短距離以上 or maxDepth 超過なら、それ以降は不要
            if (currentDist >= closestDistance || currentDist > maxDepth) {
                continue;
            }

            // 隣接タイル
            const neighbors = currentTile._neighbors;
            sortNeighborsFunc(neighbors); // 4マス程度ならソートコストは軽い

            for (const neighborTile of neighbors) {
                // 移動コストの計算
                let weight = neighborTile.getMoveWeight(
                    moveUnit,
                    ignoresUnits,
                    ignoresBreakableWalls,
                    isUnitIgnoredFunc,
                    isPathfinderEnabled
                );

                if (weight >= CanNotReachTile) {
                    // 通行不可
                    continue;
                }

                const isObstructTile = (weight === ObstructTile);
                if (isObstructTile) {
                    // 進軍阻止マス: 到達はできるが先には進まない
                    weight = 1;
                }

                const nextDist = currentDist + weight;

                // すでに見つかっている最短距離 / 深さを超えるならスキップ
                if (nextDist >= closestDistance || nextDist > maxDepth) {
                    continue;
                }

                // 目的タイルなら候補として距離を更新
                if (isTargetTileFunc(neighborTile)) {
                    if (nextDist < closestDistance) {
                        closestDistance = nextDist;
                    }
                    // Obstruct の先へは行かない仕様そのまま
                    continue;
                }

                // 進軍阻止マスは「そこに行けるだけ」で終わり（元実装と同じ）
                if (isObstructTile) {
                    continue;
                }

                // ここまで来たら、さらに先へ進む候補
                const prevBest = bestDistance.get(neighborTile);
                if (prevBest !== undefined && nextDist >= prevBest) {
                    // 以前の方が短い or 同じ距離で到達している
                    continue;
                }

                bestDistance.set(neighborTile, nextDist);
                heap.push({ tile: neighborTile, dist: nextDist });
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
        currentDepth = 0,
        isEnteringObstructTile = false,
    ) {
        for (let neighborTile of this._neighbors) {
            // 進軍阻止のマスに入っている場合は通過不可能
            // 戻ることもできないが戻るマスはすでに登録されているはず
            if (isEnteringObstructTile) {
                continue;
            }
            let key = neighborTile.id;
            let hasKey = key in tracedDepthDict;
            if (hasKey) {
                let oldDepth = tracedDepthDict[key];
                if (oldDepth <= currentDepth) {
                    continue;
                }
            }

            let weight = 1;
            if (ignoreWeights === false) {
                weight = neighborTile.getMoveWeight(unit, ignoresUnits, false);
            }

            // 進軍阻止
            let isObstructTile = weight === ObstructTile;
            if (isObstructTile) {
                weight = Math.max(1, neighborTile._moveWeights[unit.moveType]);
            }

            if (ignoreWeightsExceptCanNotReach) {
                if (weight !== CanNotReachTile) {
                    weight = 1;
                }
            }

            if (weight === CanNotReachTile) {
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
                tracedDepthDict, nextDepth, isObstructTile);
        }
    }

    existsEnemyUnit(moveUnit) {
        return this.placedUnit != null && this.placedUnit.groupId !== moveUnit.groupId;
    }

    getMoveWeight(unit, ignoresUnits,
                  ignoresBreakableWalls = false,
                  isUnitIgnoredFunc = null,
                  isPathfinderEnabled = true) {
        if (this._placedUnit != null && isUnitIgnoredFunc != null) {
            if (!isUnitIgnoredFunc?.(this._placedUnit)) {
                // タイルのユニットを無視しないので障害物扱い
                return CanNotReachTile;
            }
        }

        if (!ignoresUnits) {
            if (!unit.canActivatePass()) {
                if (this._placedUnit != null) {
                    if (!unit.isSameGroup(this.placedUnit)) {
                        // 敵ユニットだったらオブジェクトと同じ扱い
                        return CanNotReachTile;
                    }
                }

                let weight = this.__getTileMoveWeight(unit, ignoresBreakableWalls, isPathfinderEnabled);
                if (weight === CanNotReachTile || this.isWall()) {
                    return CanNotReachTile;
                }
                // 隣接マスに進軍阻止持ちがいるか確認
                for (let tile of this.battleMap.tiles) {
                    if (tile.existsEnemyUnit(unit)) {
                        let distance = this.calculateDistance(tile)
                        let enemy = tile.placedUnit;
                        switch (distance) {
                            case 1:
                                // 敵の通過不可
                                if (enemy.canActivateObstructToAdjacentTiles(unit) ||
                                    enemy.canActivateObstructToTilesWithin2Spaces(unit)) {
                                    return ObstructTile;
                                }
                                // 自分の通過不可
                                if (unit.cannotMoveThroughSpacesWithin2SpacesOfUnit(enemy) ||
                                    unit.cannotMoveThroughSpacesWithin3SpacesOfUnit(enemy)) {
                                    return ObstructTile;
                                }
                                break;
                            case 2:
                                // 敵の通過不可
                                if (enemy.canActivateObstructToTilesWithin2Spaces(unit)) {
                                    return ObstructTile;
                                }
                                // 自分の通過不可
                                if (unit.cannotMoveThroughSpacesWithin2SpacesOfUnit(enemy) ||
                                    unit.cannotMoveThroughSpacesWithin3SpacesOfUnit(enemy)) {
                                    return ObstructTile;
                                }
                                break;
                            case 3:
                                // 自分の通過不可
                                if (unit.cannotMoveThroughSpacesWithin3SpacesOfUnit(enemy)) {
                                    return ObstructTile;
                                }
                                break;
                        }
                    }
                }
            }
        }

        let weight = this.__getTileMoveWeight(unit, ignoresBreakableWalls, isPathfinderEnabled);
        // 自身が移動可能な地形を平地のように移動可能
        if (weight !== CanNotReachTile && weight !== 0) {
            for (let skillId of unit.enumerateSkills()) {
                switch (skillId) {
                    case Weapon.ReginRave:
                        if (unit.isWeaponRefined) {
                            weight = 1;
                        }
                        break;
                    case Weapon.FujinYumi:
                        if (unit.isWeaponRefined && unit.hpPercentage >= 50) {
                            weight = 1;
                        }
                        break;
                }
            }
            if (unit.hasStatusEffect(StatusEffectType.UnitCannotBeSlowedByTerrain)) {
                weight = 1;
            }
        }
        if (this._obj == null) {
            return weight;
        }

        if (this._obj instanceof TileTypeStructureBase) {
            return weight;
        }

        if (ignoresBreakableWalls) {
            // TODO: 修正する
            if (!this._obj.isBreakable) {
                return CanNotReachTile;
            }

            if (this._obj instanceof BreakableWall) {
                return weight;
            }

            if (unit.groupId === UnitGroupType.Ally) {
                if (this._obj instanceof DefenceStructureBase) {
                    return weight;
                }
            } else {
                if (this._obj instanceof OffenceStructureBase) {
                    return weight;
                }
            }
        }

        return CanNotReachTile;
    }

    isWall() {
        return this.obj instanceof Wall;
    }

    cannotApplyDivineVein() {
        return this.obj instanceof Wall ||
            this.obj instanceof ExcapeLadder ||
            this.obj instanceof OfFortress ||
            this.obj instanceof DefFortress;
    }

    isCountedAsDifficultTerrain() {
        return [
            TileType.Forest,
            TileType.Trench,
            TileType.DefensiveTrench,
            TileType.DefensiveForest,
        ].some(tileType => tileType === this.type);
    }

    countsAsDifficultOrImPassableTerrainNodeForUnitsOtherThanFlying() {
        return [
            TileType.Forest,
            TileType.Trench,
            TileType.Flier,
            TileType.DefensiveTrench,
            TileType.DefensiveForest,
        ].some(tileType => tileType === this.type);
    }

    isNotCountedAsDifficultTerrain() {
        return [
            TileType.Normal,
            TileType.DefensiveTile,
        ].some(t => t.type === this.type);
    }

    isPassableAnyMoveType() {
        return this.type !== TileType.Wall;
    }

    isImpassableAnyMoveType() {
        return this.type === TileType.Wall;
    }

    doesCountsAsDifficultTerrainExcludingImpassableTerrain() {
        return this.isCountedAsDifficultTerrain() && this.isPassableAnyMoveType();
    }

    hasDivineVein() {
        return this.divineVein !== DivineVeinType.None
    }

    hasBreakableDivineVein() {
        return DIVINE_VEIN_ICE_TYPES.has(this.divineVein);
    }

    hasIceTypeDivineVein() {
        return DIVINE_VEIN_ICE_TYPES.has(this.divineVein);
    }

    hasGreenTypeDivineVein() {
        return DIVINE_VEIN_GREEN_TYPES.has(this.divineVein);
    }

    /**
     * @param {number} groupId
     * @returns {boolean}
     */
    hasEnemyBreakableDivineVein(groupId) {
        return this.hasBreakableDivineVein() && this.divineVeinGroup !== groupId;
    }

    canBreakTile(unit) {
        if (this.hasEnemyBreakableDivineVein(unit.groupId)) {
            return true;
        }
        return this.obj && unit.canBreak(this.obj);
    }

    // TODO: 削除予約にした方が良いのか検討
    removeDivineVein() {
        this.divineVein = DivineVeinType.None;
        this.divineVeinGroup = null;
        this.divineVeinTurns = 0;
    }

    // TODO: 天脈のHPを考慮する
    /**
     * 攻撃によって天脈を破壊
     * @param {number} damage
     */
    breakDivineVein(damage = 1) {
        switch (this.divineVein) {
            case DivineVeinType.Ice:
                this.reserveDivineVein(DivineVeinType.None, null, 0);
                break;
            case DivineVeinType.Icicle:
                this.reserveDivineVein(DivineVeinType.Vert, this.divineVeinGroup, this.divineVeinTurns);
                break;
            default:
                break;
        }
    }

    initializePerTurn(group) {
        if (this.divineVeinGroup === group || group === null) {
            this.divineVeinTurns--;
            if (this.divineVeinTurns <= 0) {
                this.divineVein = DivineVeinType.None;
                this.divineVeinGroup = null;
            }
        }
    }

    resetDivineVein() {
        this.divineVein = DivineVeinType.None;
        this.divineVeinGroup = null;
        this.divineVeinTurns = 0;
        this.reservedDivineVeinSet.clear();
        this.reservedDivineVeinGroup = null;
        this.reservedDivineVeinTurns = 0;
    }

    toJSON() {
        return {
            id: this.id,
            // posX: this.posX,
            // posY: this.posY,
            // type: this.type,
            // isDefensiveTile: this.isDefensiveTile,
            // isTeleportationRequired: this.isTeleportationRequired,
            // tilePriority: this.tilePriority,
            // divineVein: this.divineVein,
        }
    }
}

/// マスの優先度を評価する際に使用するコンテキストです。
class TilePriorityContext {
    /**
     * @param  {Tile} tile
     * @param  {Unit} unit
     */
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
        this.combatResult = CombatResultType.Draw;
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
        if (assistUnit.support === Support.Pivot) {
            this.priorityToAssist =
                defensiveTileWeight * 10000000
                - this.enemyThreat * 1000000
                + this.tilePriority;
        }
        else if (assistUnit.supportInfo.assistType === AssistType.Move) {
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
        let standingStill = 0;
        if (moveUnit.actionContext.hasShuffleStatus) {
            standingStill = moveUnit.placedTile === this.tile ? 0 : 1;
        }
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
            standingStill * 100000000
            + defensiveTileWeight * 10000000
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
            case CombatResultType.Loss: return 0;
            case CombatResultType.Draw: return 1;
            case CombatResultType.Win: return 2;
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
                if (unit.moveType === MoveType.Cavalry) {
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
