



/**
 * マップの種類を変更します。
 * @param  {BattleMap} map
 * @param  {MapType} mapKind
 */
function changeMapKind(map, mapKind) {
    if (map._type == mapKind) {
        return;
    }

    map._type = mapKind;
    resetBattleMapPlacement(map, mapKind);
}

function __resetBattleMapPlacementForArena(map, type, withUnits) {
    switch (type) {
        case MapType.Arena_1:
            map.setTileType(0, 0, TileType.Forest);
            map.setTileType(0, 4, TileType.Forest);
            map.setTileType(0, 7, TileType.Forest);
            map.setTileType(1, 2, TileType.Forest);
            map.setTileType(2, 4, TileType.Forest);
            map.setTileType(2, 5, TileType.Forest);
            map.setTileType(2, 7, TileType.Forest);
            map.setTileType(3, 0, TileType.Forest);
            map.setTileType(3, 2, TileType.Forest);
            map.setTileType(3, 3, TileType.Forest);
            map.setTileType(4, 0, TileType.Forest);
            map.setTileType(4, 5, TileType.Forest);
            map.setTileType(5, 2, TileType.Forest);
            map.setTileType(5, 4, TileType.Forest);
            map.setTileType(5, 7, TileType.Forest);

            if (withUnits) {
                map.__placeEnemyUnitBySlotIfExists(0, 1, 1);
                map.__placeEnemyUnitBySlotIfExists(1, 2, 1);
                map.__placeEnemyUnitBySlotIfExists(2, 3, 1);
                map.__placeEnemyUnitBySlotIfExists(3, 4, 1);

                map.__placeAllyUnitBySlotIfExists(0, 1, 6);
                map.__placeAllyUnitBySlotIfExists(1, 2, 6);
                map.__placeAllyUnitBySlotIfExists(2, 3, 6);
                map.__placeAllyUnitBySlotIfExists(3, 4, 6);
            }

            break;
        case MapType.Arena_2:
            map.setTileType(0, 1, TileType.Flier);
            map.setTileType(0, 2, TileType.Flier);
            map.setTileType(0, 3, TileType.Forest);
            map.setTileType(0, 5, TileType.Flier);
            map.setTileType(0, 6, TileType.Flier);
            map.setTileType(0, 7, TileType.Flier);
            map.setTileType(2, 1, TileType.Flier);
            map.setTileType(2, 2, TileType.Flier);
            map.setTileType(2, 4, TileType.Forest);
            map.setTileType(2, 5, TileType.Flier);
            map.setTileType(2, 6, TileType.Flier);
            map.setTileType(4, 0, TileType.Forest);
            map.setTileType(4, 1, TileType.Flier);
            map.setTileType(4, 2, TileType.Flier);
            map.setTileType(4, 3, TileType.Forest);
            map.setTileType(4, 5, TileType.Flier);
            map.setTileType(4, 6, TileType.Flier);
            map.setTileType(5, 0, TileType.Flier);
            map.setTileType(5, 1, TileType.Flier);
            map.setTileType(5, 2, TileType.Flier);
            map.setTileType(5, 3, TileType.Forest);
            map.setTileType(5, 5, TileType.Flier);
            map.setTileType(5, 6, TileType.Flier);
            map.setTileType(5, 7, TileType.Forest);

            if (withUnits) {
                map.__placeEnemyUnitBySlotIfExists(0, 0, 0);
                map.__placeEnemyUnitBySlotIfExists(1, 1, 0);
                map.__placeEnemyUnitBySlotIfExists(2, 2, 0);
                map.__placeEnemyUnitBySlotIfExists(3, 3, 0);

                map.__placeAllyUnitBySlotIfExists(0, 1, 7);
                map.__placeAllyUnitBySlotIfExists(1, 2, 7);
                map.__placeAllyUnitBySlotIfExists(2, 3, 7);
                map.__placeAllyUnitBySlotIfExists(3, 4, 7);
            }
            break;
        case MapType.Arena_3:
            map.__placeBreakableWalls([
                [0, 2], [2, 2], [5, 2],
                [0, 3], [2, 3], [3, 3], [5, 3],
                [0, 4], [2, 4], [3, 4], [5, 4],
                [0, 5], [3, 5], [5, 5],
            ], BreakableWallIconType.Wall3);
            if (withUnits) {
                map.__placeElemyUnits([[1, 7], [2, 7], [3, 7], [4, 7]]);
                map.__placeAllyUnits([[1, 0], [2, 0], [3, 0], [4, 0]]);
            }
            break;
        case MapType.Arena_4:
            map.__setTileTypes([
                [1, 0], [2, 0], [4, 0], [5, 0],
                [0, 2], [1, 2], [3, 2], [4, 2],
                [1, 4], [2, 4], [4, 4], [5, 4],
                [0, 6], [1, 6], [3, 6], [4, 6],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnits([[1, 1], [2, 1], [3, 1], [4, 1]]);
                map.__placeAllyUnits([[0, 7], [1, 7], [4, 7], [5, 7]]);
            }
            break;
        case MapType.Arena_5:
            map.__setTileTypes([
                [3, 1],
                [2, 2], [3, 2],
                [2, 3], [3, 3],
                [2, 4], [3, 4],
                [2, 5], [3, 5],
                [2, 6],
            ], TileType.Flier);
            map.__setTileTypes([
                [4, 1],
                [2, 1],
                [4, 4],
                [1, 5],
                [3, 6],
                [5, 7],
            ], TileType.Forest);
            if (withUnits) {
                map.__placeElemyUnits([[5, 1], [5, 2], [5, 5], [5, 6]]);
                map.__placeAllyUnits([[0, 0], [0, 1], [0, 6], [0, 7]]);
            }
            break;
        case MapType.Arena_6:
            map.__setTileTypes([
                [2, 3], [3, 3],
                [2, 4], [3, 4],
            ], TileType.Flier);
            map.__setTileTypes([
                [0, 0], [0, 7],
                [1, 3],
                [2, 5],
                [3, 2], [3, 7],
                [4, 0],
                [5, 0], [5, 7],
            ], TileType.Forest);
            map.__setTileTypes([
                [0, 2], [1, 2], [5, 2],
                [4, 4],
            ], TileType.Trench);
            if (withUnits) {
                map.__placeAllyUnits([[2, 0], [3, 0], [2, 1], [3, 1]]);
                map.__placeElemyUnits([[1, 6], [2, 6], [3, 6], [4, 6]]);
            }
            break;
        case MapType.Arena_7:
            map.__placeWalls([
                [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
                [0, 1], [1, 1],
                [0, 6], [2, 6], [5, 6],
            ]);
            map.__placeBreakableWalls([
                [5, 3], [0, 4],
            ], BreakableWallIconType.Wall2);
            map.__setTileTypes([
                [1, 3],
                [4, 2],
                [1, 4],
            ], TileType.Flier);
            map.__setTileTypes([
                [2, 3], [3, 3],
                [2, 4], [4, 4],
                [3, 5], [4, 5],
            ], TileType.Trench);
            map.__setTileTypes([
                [4, 3],
                [3, 4],
                [2, 5],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnits([[2, 1], [3, 1], [4, 1], [5, 1]]);
                map.__placeAllyUnits([[1, 7], [2, 7], [3, 7], [4, 7]]);
            }
            break;
        case MapType.Arena_8:
            map.__setTileTypesByPosYX([
                [1, 4],
                [2, 1],
                [3, 3], [3, 4],
                [5, 1], [5, 3],
                [6, 5],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [2, 2], [2, 3],
                [4, 1],
                [5, 0], [5, 4], [5, 5],
            ], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_9:
            map.__setTileTypesByPosYX([
                [0, 3],
                [2, 4],
                [5, 1],
                [7, 2],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [1, 1],
                [6, 4],
            ], TileType.DefensiveForest);
            map.__setTileTypesByPosYX([
                [3, 2], [4, 3],
            ], TileType.Trench);
            map.__setTileTypesByPosYX([
                [0, 5],
                [2, 1], [2, 2],
                [5, 3], [5, 4],
                [7, 0],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [3, 3],
                [4, 2],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnits([[0, 1], [0, 2], [0, 5], [0, 6]]);
                map.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
            }
            break;
        case MapType.Arena_10:
            map.__setTileTypesByPosYX([
                [1, 0], [1, 1], [1, 4],
                [3, 0], [3, 5],
                [5, 0], [5, 3], [5, 4],
                [6, 3],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [4, 2],
                [4, 3],
            ], TileType.Trench);
            map.__placeBreakableWallsByPosYX([
                [3, 1], [3, 2],
            ], BreakableWallIconType.Wall2);
            map.__setTileTypesByPosYX([
                [5, 1],
                [6, 1], [6, 2],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 3], [0, 4], [1, 5], [2, 5]]);
                map.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 1], [7, 2]]);
            }
            break;
        case MapType.Arena_11:
            map.__setTileTypesByPosYX([
                [0, 2], [0, 3],
                [1, 2], [1, 3],
                [3, 0], [3, 1], [3, 4], [3, 5],
                [5, 1], [5, 4],
                [7, 2], [7, 3],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [2, 0], [2, 1], [2, 4], [2, 5],
                [4, 0], [4, 1], [4, 4], [4, 5],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeAllyUnitsByPosYX([[1, 0], [1, 1], [1, 4], [1, 5]]);
                map.__placeElemyUnitsByPosYX([[6, 0], [6, 1], [6, 4], [6, 5]]);
            }
            break;
        case MapType.Arena_12:
            map.__setTileTypesByPosYX([
                [0, 0], [0, 5],
                [7, 0], [7, 5],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [1, 1], [1, 2],
                [2, 3], [2, 4],
                [3, 1], [3, 2],
                [4, 3], [4, 4],
                [5, 1], [5, 2],
                [6, 3], [6, 4],
            ], TileType.DefensiveTile);
            map.__placeBreakableWallsByPosYX([
                [1, 3], [1, 4],
                [2, 1], [2, 2],
                [3, 3], [3, 4],
                [4, 1], [4, 2],
                [5, 3], [5, 4],
                [6, 1], [6, 2],
            ], BreakableWallIconType.Wall3);

            if (withUnits) {
                map.__placeAllyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                map.__placeElemyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
            }
            break;
        case MapType.Arena_13:
            map.__setTileTypesByPosYX([
                [0, 0], [0, 1],
                [1, 0],
                [2, 0], [2, 1],
                [3, 0], [3, 1], [3, 4], [3, 5],
                [4, 0], [4, 5],
                [5, 5],
                [6, 0], [6, 5],
                [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
            ], TileType.Flier);
            map.__placeBreakableWallsByPosYX([
                [2, 2], [2, 3], [2, 4], [2, 5],
                [4, 1], [4, 2], [4, 3], [4, 4],
            ], BreakableWallIconType.Box);

            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                map.__placeAllyUnitsByPosYX([[5, 1], [5, 2], [6, 1], [6, 2]]);
            }
            break;
        case MapType.Arena_14:
            map.__setTileTypesByPosYX([
                [1, 1], [1, 4],
                [2, 0], [2, 2], [2, 3], [2, 5],
                [3, 1], [3, 4],
                [4, 1], [4, 4],
                [5, 0], [5, 2], [5, 3], [5, 5],
                [6, 1], [6, 4],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [2, 1], [2, 4],
                [5, 1], [5, 4],
            ], TileType.DefensiveForest);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_15:
            map.__setTileTypesByPosYX([
                [3, 3], [3, 4],
                [4, 1], [4, 2],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [3, 1], [4, 4],
            ], TileType.DefensiveForest);
            map.__setTileTypesByPosYX([
                [0, 0], [7, 5],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [1, 1], [1, 2],
                [2, 2], [2, 3],
                [5, 2], [5, 3],
                [6, 3], [6, 4],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeAllyUnitsByPosYX([[1, 4], [1, 5], [2, 4], [2, 5]]);
                map.__placeElemyUnitsByPosYX([[5, 0], [5, 1], [6, 0], [6, 1]]);
            }
            break;
        case MapType.Arena_16:
            map.__setTileTypesByPosYX([
                [1, 0], [1, 5],
                [6, 0], [6, 5],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [2, 2], [2, 3],
                [5, 2], [5, 3],
            ], TileType.DefensiveTile);
            map.__placeBreakableWallsByPosYX([
                [3, 2], [4, 5],
            ], BreakableWallIconType.Wall3);
            map.__placeWallsByPosYX([
                [3, 1], [3, 4],
                [4, 1], [4, 4],
            ]);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_17:
            map.__setTileTypesByPosYX([
                [2, 4], [4, 1],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [1, 4], [2, 3], [2, 5], [3, 4],
                [3, 1], [4, 0], [4, 2], [5, 1],
            ], TileType.Trench);
            map.__placeBreakableWallsByPosYX([
                [2, 0], [2, 2],
                [4, 3], [4, 5],
            ], BreakableWallIconType.Wall2);
            map.__placeWallsByPosYX([
                [0, 0], [5, 4],
                [6, 1], [7, 5],
            ]);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[6, 2], [6, 3], [7, 2], [7, 3]]);
            }
            break;
        case MapType.Arena_18:
            map.__placeBreakableWallsByPosYX([
                [2, 2], [2, 4],
                [3, 1], [3, 3], [3, 5],
            ], BreakableWallIconType.Wall2);
            map.__placeWallsByPosYX([
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
            ]);
            map.__setTileTypesByPosYX([
                [1, 1], [1, 2], [1, 4], [1, 5],
                [2, 1], [2, 5],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [3, 2], [3, 4], [4, 3],
            ], TileType.Trench);
            map.__setTileTypesByPosYX([
                [5, 2], [6, 4], [7, 0],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [1, 3],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_19:
            map.__placeBreakableWallsByPosYX([
                [3, 2], [3, 3], [4, 2], [4, 3],
            ], BreakableWallIconType.Wall3);
            map.__setTileTypesByPosYX([
                [0, 3], [0, 4], [0, 5],
                [1, 5],
                [2, 3],
                [3, 4],
                [4, 1],
                [5, 2],
                [6, 0],
                [7, 0], [7, 1], [7, 2],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [2, 2], [3, 1], [4, 4], [5, 3],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [2, 0], [5, 5],
            ], TileType.Forest);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [1, 0], [1, 2], [2, 1]]);
                map.__placeAllyUnitsByPosYX([[5, 4], [6, 3], [6, 5], [7, 4]]);
            }
            break;
        case MapType.Arena_20:
            map.__setTileTypesByPosYX([
                [0, 0], [1, 0],
                [3, 2],
                [4, 5],
                [5, 2],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [1, 2], [1, 3],
                [7, 2], [7, 3],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [2, 4],
                [4, 1], [4, 3],
                [6, 4],
            ], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                map.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 0], [7, 1]]);
            }
            break;
        case MapType.Arena_21:
            map.__placeBreakableWalls([
                [1, 2], [1, 3], [1, 4], [1, 5],
                [4, 2], [4, 3], [4, 4], [4, 5],
            ], BreakableWallIconType.Wall3);
            map.__setTileTypesByPosYX([
                [2, 2], [2, 5],
                [3, 0], [3, 3],
                [4, 2], [4, 5],
                [5, 0], [5, 3],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_22:
            map.__setTileTypesByPosYX([
                [0, 1], [0, 5],
                [3, 3],
                [4, 1], [4, 5],
                [6, 3],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [1, 0], [1, 2], [1, 4],
                [3, 0], [3, 2], [3, 4],
                [5, 0], [5, 2], [5, 4],
                [7, 0], [7, 2], [7, 4],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 4], [0, 5]]);
                map.__placeAllyUnitsByPosYX([[6, 1], [6, 2], [6, 4], [6, 5]]);
            }
            break;
        case MapType.Arena_23:
            map.__setTileTypesByPosYX([
                [0, 2], [0, 3],
                [2, 1], [2, 2], [2, 3], [2, 4],
                [5, 1], [5, 2], [5, 3], [5, 4],
                [7, 2], [7, 3],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [3, 2], [3, 3],
                [4, 2], [4, 3],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                map.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
            }
            break;
        case MapType.Arena_24:
            map.__setTileTypesByPosYX([
                [2, 1], [2, 2],
                [3, 0], [3, 1], [3, 3], [3, 4],
                [4, 1], [4, 4],
                [5, 2], [5, 3],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [1, 0], [1, 5],
                [2, 3],
                [4, 2], [4, 5],
                [5, 4],
                [6, 1],
            ], TileType.DefensiveForest);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_25:
            map.__setTileTypesByPosYX([
                [3, 2], [3, 3],
                [4, 2], [4, 3],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [2, 1], [2, 4],
                [5, 1], [5, 4],
            ], TileType.DefensiveForest);
            map.__setTileTypesByPosYX([
                [2, 2], [2, 3],
                [3, 1], [3, 4],
                [4, 1], [4, 4],
                [5, 2], [5, 3],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_26:
            map.__placeBreakableWallsByPosYX([
                [2, 1], [2, 3], [2, 5],
                [3, 0], [3, 2], [3, 4],
                [4, 1], [4, 3], [4, 5],
                [5, 0], [5, 2], [5, 4],
            ], BreakableWallIconType.Wall2);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;

        case MapType.Arena_27:
            map.__setTileTypesByPosYX([
                [2, 1], [2, 2],
                [5, 3], [5, 4],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [0, 3],
                [2, 4],
                [3, 4],
                [4, 1],
                [5, 1],
                [7, 2],
            ], TileType.Forest);
            if (withUnits) {
                map.__placeElemyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                map.__placeAllyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
            }
            break;
        case MapType.Arena_28:
            map.__setTileTypesByPosYX([
                [2, 1], [2, 4],
                [4, 3],
                [5, 1], [5, 5],
                [6, 0],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[1, 0], [1, 2], [1, 3], [1, 5]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        case MapType.Arena_29:
            map.__placeWallsByPosYX([
                [0, 1], [0, 4],
                [2, 1], [2, 4],
                [5, 1], [5, 4],
                [7, 1], [7, 4],
            ]);
            map.__placeBreakableWallsByPosYX([
                [1, 1], [1, 4],
                [2, 3],
                [3, 1], [3, 4],
                [4, 1], [4, 4],
                [5, 2],
                [6, 1], [6, 4],
            ], BreakableWallIconType.Wall3);
            map.__setTileTypesByPosYX([
                [0, 0], [0, 5],
                [3, 2],
                [7, 0], [7, 3],
            ], TileType.Forest);
            if (withUnits) {
                map.__placeAllyUnits([[0, 2], [0, 3], [0, 4], [0, 5]]);
                map.__placeElemyUnits([[5, 2], [5, 3], [5, 4], [5, 5]]);
            }
            break;
        case MapType.Arena_30:
            map.__placeWallsByPosYX([
                [3, 0], [3, 2], [3, 4],
                [7, 0], [7, 2], [7, 4],
            ]);
            map.__setTileTypesByPosYX([
                [1, 1], [1, 3], [1, 5],
                [5, 1], [5, 3], [5, 5],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [0, 4], [0, 5]]);
                map.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [6, 2], [6, 3]]);
            }
            break;
        case MapType.Arena_31:
            map.__placeWallsByPosYX([
                [7, 2],
            ]);
            map.__placeBreakableWallsByPosYX([
                [3, 3],
                [4, 0, 2], [4, 1],
                [7, 3],
            ], BreakableWallIconType.Wall3);

            map.__setTileTypesByPosYX([
                [2, 4],
            ], TileType.Trench);
            map.__setTileTypesByPosYX([
                [0, 0], [0, 1], [0, 3], [0, 4],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [0, 5],
                [1, 5],
                [3, 2], [4, 2],
                [5, 0],
                [6, 0], [6, 1],
                [7, 0], [7, 1],
            ], TileType.Forest);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[5, 5], [6, 4], [6, 5], [7, 4]]);
                map.__placeAllyUnitsByPosYX([[1, 0], [1, 1], [2, 0], [2, 1]]);
            }
            break;
        case MapType.Arena_32:
            map.__placeWallsByPosYX([
                [3, 2], [4, 2],
            ]);
            map.__setTileTypesByPosYX([
                [0, 0], [0, 5], [2, 3], [3, 3], [4, 3],
                [7, 0], [7, 1], [7, 4], [7, 5],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [0, 1], [0, 3], [0, 4],
                [1, 0],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [5, 2],
            ], TileType.DefensiveForest);
            map.__setTileTypesByPosYX([
                [5, 3],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [7, 2], [7, 3],
            ], TileType.DefensiveTrench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[2, 5], [3, 4], [4, 4], [5, 5]]);
                map.__placeAllyUnitsByPosYX([[2, 0], [3, 1], [4, 1], [5, 0]]);
            }
            break;
        case MapType.Arena_33:
            map.__placeWallsByPosYX([
                [0, 0], [5, 5],
            ]);
            map.__placeBreakableWallsByPosYX([
                [1, 0],
                [4, 5], [5, 3], [5, 4],
                [6, 2], [6, 5],
                [7, 0], [7, 5],
            ], BreakableWallIconType.Wall3);
            map.__setTileTypesByPosYX([
                [4, 2],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [1, 3],
                [4, 4],
            ], TileType.Trench);
            map.__setTileTypesByPosYX([
                [5, 0],
            ], TileType.DefensiveTrench);

            map.__setTileTypesByPosYX([
                [2, 2], [2, 5], [3, 1], [3, 2], [3, 5],
                [4, 1],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [1, 1], [1, 4]]);
                map.__placeAllyUnitsByPosYX([[6, 1], [6, 3], [7, 2], [7, 4]]);
            }
            break;
        case MapType.Arena_34:
            map.__setTileTypesByPosYX([
                [0, 0], [0, 1], [0, 2],
                [1, 0], [1, 1],
                [2, 0], [2, 1], [2, 2],
                [3, 0], [3, 1],
                [4, 0],
                [5, 0], [5, 1],
                [6, 0],
                [7, 5],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [0, 3], [1, 2],
                [3, 4], [3, 5],
                [6, 4], [6, 5],
                [7, 3], [7, 4],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [4, 1],
                [7, 0],
            ], TileType.DefensiveTile);
            map.__placeBreakableWallsByPosYX([
                [4, 2, 2], [4, 3],
            ], BreakableWallIconType.Wall3);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 4], [1, 5]]);
                map.__placeAllyUnitsByPosYX([[5, 4], [6, 2], [6, 3], [7, 2]]);
            }
            break;
        case MapType.Arena_35:
            map.__setTileTypesByPosYX([
                [0, 2], [0, 3], [0, 4], [0, 5],
                [2, 2], [2, 3],
                [3, 0], [3, 2], [3, 3],
                [4, 0], [4, 2],
                [5, 2], [5, 3], [5, 4],
                [7, 2], [7, 3], [7, 4], [7, 5],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [0, 0],
                [0, 1],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [3, 1],
                [4, 1], [4, 3],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[1, 4], [1, 5], [2, 4], [2, 5]]);
                map.__placeAllyUnitsByPosYX([[6, 0], [6, 1], [7, 0], [7, 1]]);
            }
            break;
        case MapType.Arena_46:
            map.__setTileTypesByPosYX([
                [3, 1], [3, 2], [3, 4],
                [4, 1], [4, 3], [4, 4],
            ], TileType.Flier);
            map.__placeWallsByPosYX([
                [2, 3],
            ]);
            map.__placeBreakableWallsByPosYX([
                [0, 2], [0, 3],
                [2, 2],
                [3, 3],
                [4, 2],
                [6, 3],
                [7, 2], [7, 3, 2],
            ], BreakableWallIconType.Wall3);
            map.__setTileTypesByPosYX([
                [0, 0],
                [0, 5],
                [5, 3],
                [7, 0],
                [7, 5],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [1, 3],
            ], TileType.Trench);
            map.__setTileTypesByPosYX([
                [5, 2],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[1, 5], [2, 5], [5, 5], [6, 5]]);
                map.__placeAllyUnitsByPosYX([[1, 0], [2, 0], [5, 0], [6, 0]]);
            }
            break;
        case MapType.Arena_47:
            map.__setTileTypesByPosYX([
                [0, 0], [0, 1], [0, 2], [0, 4], [0, 5],
                [1, 0],
                [2, 3], [2, 4],
                [4, 0], [4, 2], [4, 3],
                [6, 2], [6, 3],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [0, 3],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [2, 2], [4, 4], [5, 3],
            ], TileType.DefensiveForest);
            map.__setTileTypesByPosYX([
                [1, 3],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [3, 4],
                [7, 2],
            ], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[1, 5], [2, 5], [5, 5], [6, 5]]);
                map.__placeAllyUnitsByPosYX([[2, 0], [3, 0], [6, 0], [7, 0]]);
            }
            break;
        case MapType.Arena_48:
            map.__setTileTypesByPosYX([
                [1, 0], [1, 3], [1, 5],
                [6, 0], [6, 3], [6, 5],
            ], TileType.Flier);
            map.__placeWallsByPosYX([
                [4, 0], [4, 3], [4, 5],
                [5, 0],
            ]);
            map.__placeBreakableWallsByPosYX([
                [2, 0], [2, 1],
                [3, 0], [3, 1], [3, 2], [3, 5],
                [5, 3],
            ], BreakableWallIconType.Wall3);
            map.__setTileTypesByPosYX([
                [3, 3],
                [4, 1], [4, 2],
            ], TileType.DefensiveTile);
            map.__setTileTypesByPosYX([
                [4, 4],
            ], TileType.DefensiveTrench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                map.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
            }
            break;
        case MapType.Arena_49:
            map.__setTileTypesByPosYX([
                [1, 0], [1, 3], [1, 4],
                [2, 4],
                [5, 1],
                [6, 1], [6, 2], [6, 5],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [0, 0], [0, 5],
                [2, 0],
                [3, 0],
                [4, 5],
                [5, 5],
                [7, 0], [7, 5],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [3, 3],
                [4, 2],
            ], TileType.DefensiveTile);
            map.__placeBreakableWallsByPosYX([
                [3, 1], [3, 2],
                [4, 3], [4, 4],
            ], BreakableWallIconType.Wall3);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
                map.__placeAllyUnitsByPosYX([[0, 1], [0, 2], [0, 3], [0, 4]]);
            }
            break;
        case MapType.Arena_50:
            map.__placeWallsByPosYX([
                [0, 0], [0, 1], [0, 5],
                [1, 1], [1, 4], [1, 5],
                [3, 0],
                [5, 0], [5, 5],
            ]);
            map.__placeBreakableWallsByPosYX([
                [0, 4, 2],
                [1, 0],
                [3, 2, 2], [3, 3], [3, 5],
                [5, 1], [5, 3],
            ], BreakableWallIconType.Wall3);
            map.__setTileTypesByPosYX([
                [6, 0], [6, 5],
                [7, 0], [7, 5],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [3, 1], [3, 4],
                [5, 2],
            ], TileType.Trench);
            map.__setTileTypesByPosYX([
                [4, 2],
            ], TileType.DefensiveTile);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 2], [0, 3], [1, 2], [1, 3]]);
                map.__placeAllyUnitsByPosYX([[7, 1], [7, 2], [7, 3], [7, 4]]);
            }
            break;
        default:
            return;
    }
}

function __resetBattleMapPlacementForAetherRaid(map, type) {
    switch (type) {
        case MapType.None:
            break;
        case MapType.Izumi: // 泉の城
            {
                map.setTileType(0, 4, TileType.Flier);
                map.setTileType(5, 2, TileType.Flier);
            }
            break;
        case MapType.Hyosetsu: // 氷雪の城
            {
                map.setTileType(1, 2, TileType.Forest);
                map.setTileType(4, 4, TileType.Forest);
                map.setTileType(3, 5, TileType.Forest);
            }
            break;
        case MapType.Haikyo: // 廃墟の城
            {
                map.__placeObjForcibly(map._walls[0], 2, 4);
                map.__placeObjForcibly(map._breakableWalls[0], 1, 4);
                map.__placeObjForcibly(map._breakableWalls[1], 4, 4);
                map.__placeObjForcibly(map._breakableWalls[2], 0, 2);
                map.__setBreakableWallIconType(BreakableWallIconType.Wall);
            }
            break;
        case MapType.Yukigesho: // 雪化粧の城
            {
                map.__placeObjForcibly(map._breakableWalls[0], 0, 4);
                map.setTileType(1, 3, TileType.DefensiveTrench);
                map.setTileType(2, 5, TileType.Forest);
                map.setTileType(5, 2, TileType.DefensiveTrench);
                map.__setBreakableWallIconType(BreakableWallIconType.Wall);
            }
            break;
        case MapType.Sabaku: // 砂漠の城
            {
                map.setTileType(2, 2, TileType.Flier);
                map.setTileType(2, 5, TileType.Flier);
                map.setTileType(3, 5, TileType.Flier);
            }
            break;
        case MapType.Harukaze: // 春風の城
            {
                map.__placeObjForcibly(map._walls[0], 2, 5);
                map.__placeObjForcibly(map._breakableWalls[2], 5, 5);
                map.__placeObjForcibly(map._breakableWalls[0], 0, 2);
                map.__placeObjForcibly(map._breakableWalls[1], 3, 2);
                map.__setBreakableWallIconType(BreakableWallIconType.Wall);
            }
            break;
        case MapType.Komorebi: // 木漏れ日の城
            {
                map.setTileType(1, 4, TileType.Trench);
                map.setTileType(2, 4, TileType.Forest);
                map.setTileType(3, 2, TileType.Trench);
                map.setTileType(4, 2, TileType.Trench);
            }
            break;
        case MapType.Wasurerareta: // 忘れられた城
            {
                map.setTileType(1, 2, TileType.DefensiveTile);
                map.setTileType(2, 2, TileType.DefensiveTile);
                map.setTileType(1, 3, TileType.Forest);
                map.__placeObjForcibly(map._walls[0], 5, 4);
            }
            break;
        case MapType.Natsukusa: // 夏草の城
            {
                map.setTileType(3, 2, TileType.Forest);
                map.setTileType(4, 2, TileType.Forest);
                map.setTileType(4, 5, TileType.Forest);
            }
            break;
        case MapType.Syakunetsu: // 灼熱の城
            {
                map.setTileType(5, 2, TileType.Flier);
                map.setTileType(2, 4, TileType.Flier);
                map.setTileType(2, 5, TileType.Flier);
            }
            break;
        case MapType.DreamCastle: {
            map.setTileType(0, 3, TileType.Flier);
            map.setTileType(5, 3, TileType.Flier);
        }
            break;
        case MapType.NightmareCastle: {
            map.setTileType(0, 5, TileType.DefensiveForest);
            map.setTileType(2, 2, TileType.DefensiveForest);
            map.setTileType(3, 2, TileType.DefensiveForest);
        }
            break;
        default:
            return;
    }
}

function __resetBattleMapPlacementForResonantBattles(map, type, withUnits) {
    switch (type) {
        case MapType.ResonantBattles_Default:
            break;
        case MapType.ResonantBattles_1:
            map.__placeWallsByPosYX([
                [0, 1], [0, 2], [3, 4],
                [5, 7],
                [6, 6],
                [7, 1],
                [9, 7],
            ]);
            map.__placeBreakableWallsByPosYX([
                [1, 4],
                [2, 3],
                [3, 3],
                [6, 7],
                [7, 0], [7, 6],
            ], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([
                [1, 6],
                [2, 0],
                [4, 7],
                [5, 2],
                [6, 4],
                [7, 3],
                [8, 7],
                [9, 0],
            ], TileType.Forest);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([
                    [2, 1], [2, 4], [3, 0], [3, 2], [3, 5],
                    [4, 2], [4, 4], [4, 7],
                    [5, 0], [5, 6],
                    [6, 1], [6, 5],
                ]);
            }
            break;
        case MapType.ResonantBattles_2:
            map.__placeWallsByPosYX([
                [0, 3], [0, 4],
                [3, 2], [3, 5],
                [6, 3], [6, 4],
                [9, 0], [9, 7],
            ]);
            map.__placeBreakableWallsByPosYX([
                [1, 1], [1, 7],
                [2, 5],
                [6, 1], [6, 5], [6, 7],
                [7, 0], [7, 2], [7, 6],
            ], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([
                [3, 1],
                [3, 7],
                [4, 0],
                [4, 6],
            ], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([
                    [2, 1], [2, 4],
                    [3, 0], [3, 4], [3, 7],
                    [4, 2], [4, 3], [4, 5],
                    [5, 0], [5, 6], [5, 7],
                    [6, 2],
                ]);
            }
            break;
        case MapType.ResonantBattles_3:
            map.__placeWallsByPosYX([
                [9, 7],
            ]);

            map.__setTileTypesByPosYX([
                [0, 0], [0, 4], [0, 7],
                [1, 3], [1, 4], [1, 7],
                [2, 3],
                [4, 4],
                [5, 4],
                [6, 0], [6, 3], [6, 4],
                [7, 0], [7, 1], [7, 7],
                [8, 0], [8, 6], [8, 7],
                [9, 0], [9, 6],
            ], TileType.Flier);

            map.__setTileTypesByPosYX([
                [0, 2], [0, 6],
                [3, 0],
                [5, 7],
                [7, 3],
                [9, 1],
            ], TileType.Forest);

            if (withUnits) {
                map.__placeElemyUnitsByPosYX([
                    [2, 0], [2, 1], [2, 7],
                    [3, 3], [3, 4], [3, 5], [3, 6],
                    [4, 2],
                    [5, 0], [5, 3], [5, 6],
                    [6, 7],
                ]);
            }
            break;
        case MapType.ResonantBattles_4:
            map.__placeWallsByPosYX([
                [0, 2], [0, 3],
                [2, 5],
                [3, 7],
                [6, 6],
                [8, 0],
                [9, 7]
            ]);
            map.__setTileTypesByPosYX([
                [4, 3],
                [6, 1],
            ], TileType.Flier);
            map.__setTileTypesByPosYX([
                [4, 2],
                [4, 6],
            ], TileType.Trench);
            map.__setTileTypesByPosYX([
                [1, 1], [1, 4], [1, 7],
                [2, 7],
                [3, 3],
                [4, 5],
                [5, 1],
                [6, 4],
                [7, 6],
                [8, 2]
            ], TileType.Forest);

            if (withUnits) {
                map.__placeElemyUnitsByPosYX([
                    [2, 2], [2, 3],
                    [3, 5], [3, 6],
                    [4, 0], [4, 1], [4, 4],
                    [5, 3], [5, 5], [5, 6], [5, 7],
                    [6, 3],
                ]);
            }
            break;
        case MapType.ResonantBattles_5:
            map.__placeWallsByPosYX([
                [0, 1], [0, 2], [0, 6],
                [1, 4], [1, 5],
                [2, 2],
                [3, 7],
                [4, 2],
                [5, 0],
                [6, 3],
                [7, 1], [7, 2],
                [9, 0], [9, 7],
            ]);
            map.__placeBreakableWallsByPosYX([
                [2, 5],
                [4, 5],
                [5, 5],
                [6, 4],
                [8, 1],
            ], BreakableWallIconType.Wall);

            if (withUnits) {
                map.__placeElemyUnitsByPosYX([
                    [2, 6],
                    [3, 1],
                    [3, 2], [3, 4],
                    [3, 5], [4, 0], [4, 4],
                    [5, 2], [5, 3], [5, 6], [5, 7],
                    [6, 1],
                ]);
            }
            break;
        case MapType.ResonantBattles_6:
            map.__placeWallsByPosYX([
                [4, 3], [4, 4],
                [9, 0], [9, 7],
            ]);
            map.__placeBreakableWallsByPosYX([
                [7, 1], [7, 3], [7, 4], [7, 6],
            ], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([
                [0, 3],
                [2, 7],
                [5, 0],
                [8, 7],
            ], TileType.Forest);
            map.__setTileTypesByPosYX([
                [5, 2],
                [5, 5],
            ], TileType.Trench);

            if (withUnits) {
                map.__placeElemyUnitsByPosYX([
                    [2, 3],
                    [2, 4],
                    [3, 0], [3, 1],
                    [3, 5], [3, 6], [4, 2],
                    [5, 4], [5, 7], [6, 0], [6, 7],
                    [7, 2],
                ]);
            }
            break;
        case MapType.ResonantBattles_7:
            map.__placeWallsByPosYX([
                [0, 2], [4, 5],
                [5, 2], [8, 0],
                [9, 7]
            ]);
            map.__placeBreakableWallsByPosYX([
                [1, 3], [1, 5],
                [4, 0], [6, 6],
                [8, 1],
            ], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([
                [2, 0],
                [2, 7],
                [7, 4],
                [7, 7],
            ], TileType.Flier);

            if (withUnits) {
                map.__placeElemyUnitsByPosYX([
                    [2, 2],
                    [2, 5],
                    [3, 0], [3, 2],
                    [3, 5], [3, 7], [4, 4],
                    [5, 3], [5, 7], [6, 0], [6, 5],
                    [7, 1],
                ]);
            }
            break;
        case MapType.ResonantBattles_8:
            map.__placeWallsByPosYX([[0, 2], [0, 3], [0, 4], [0, 5], [9, 0], [9, 7],]);
            map.__placeBreakableWallsByPosYX([[1, 4], [7, 7], [8, 2],], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([[4, 3], [4, 4], [5, 3], [5, 4],], TileType.Flier);
            map.__setTileTypesByPosYX([[3, 2], [4, 7], [5, 0], [6, 6], [7, 1],], TileType.Forest);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[2, 3], [2, 5], [3, 0], [3, 1], [3, 5], [4, 7], [5, 1], [5, 2], [5, 6], [6, 4], [7, 0], [7, 6],]);
            }
            break;
        default:
            return;
    }

    if (withUnits) {
        // 双界の味方配置はどのマップも同じ
        map.__placeAllyUnitsByPosYX([[9, 2], [9, 3], [9, 4], [9, 5]]);
    }
}
/**
 * @param  {BattleMap} map
 * @param  {MapType} type
 * @param  {Boolean} withUnits
 */
function __resetBattleMapPlacementForTempestTrials(map, type, withUnits) {
    switch (type) {
        case MapType.TempestTrials_KojoNoTakaraSagashi:
            map.__placeWallsByPosYX([
                [1, 0], [1, 1],
                [3, 4],
                [4, 0],
                [7, 5],
            ]);

            map.__placeBreakableWallsByPosYX([
                [6, 2],
            ], BreakableWallIconType.Box);

            map.__setTileTypesByPosYX([
                [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
                [1, 3], [1, 4],
                [3, 3],
                [5, 3],
                [7, 0], [7, 3],
            ], TileType.Flier);
            if (withUnits) {
                map.__placeAllyUnitsByPosYX([[2, 0], [2, 1], [2, 2], [3, 1]]);
                map.__placeElemyUnitsByPosYX([[2, 5], [5, 5], [6, 4], [7, 2], [7, 4]]);
            }
            break;
        case MapType.TempestTrials_ButosaiNoKyodai:
            map.__placeWallsByPosYX([
                [6, 0], [6, 1],
                [7, 0], [7, 1],
            ]);

            map.__setTileTypesByPosYX([
                [0, 0],
                [1, 0], [1, 5],
                [2, 5],
                [3, 1],
                [4, 4],
                [6, 4],
            ], TileType.Forest);

            if (withUnits) {
                map.__placeAllyUnitsByPosYX([[0, 2], [0, 3], [1, 2], [1, 3]]);
                map.__placeElemyUnitsByPosYX([[3, 0], [3, 5], [5, 0], [5, 5], [7, 2]]);
            }
            break;
        case MapType.TempestTrials_ShinmaiNinjaNoHatsuNinmu:
            map.__placeWallsByPosYX([
                [2, 2], [2, 3],
                [3, 2], [3, 3],
                [6, 0], [6, 1],
                [6, 4], [6, 5],
            ]);

            map.__setTileTypesByPosYX([
                [1, 5],
                [4, 0],
                [4, 4],
            ], TileType.Flier);

            if (withUnits) {
                map.__placeAllyUnitsByPosYX([[6, 2], [6, 3], [7, 2], [7, 3]]);
                map.__placeElemyUnitsByPosYX([[0, 0], [0, 2], [1, 4], [2, 1], [2, 5]]);
            }
            break;
        default:
            throw new Error("unexpected map kind " + type);
    }
}
/**
 * @param  {BattleMap} map
 * @param  {MapType} type
 * @param  {Boolean} withUnits
 */
function __resetBattleMapPlacementForSummonerDuels(map, type, withUnits) {
    switch (type) {
        case MapType.SummonersDuel_Default:
            map.__placeWallsByPosYX([
                [0, 0], [0, 1],
                [1, 0], [1, 1],
                [8, 6], [8, 7],
                [9, 6], [9, 7],
            ]);
            break;
        case MapType.SummonersDuel_EnclosedRuins:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [0, 2], [0, 4], [0, 6], [1, 0], [1, 1], [1, 7], [8, 0], [8, 6], [8, 7], [9, 1], [9, 3], [9, 5], [9, 6], [9, 7],]);
            map.__placeBreakableWallsByPosYX([[0, 5], [0, 7], [2, 0], [7, 7], [9, 0], [9, 2],], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([[4, 4], [5, 3],], TileType.Forest);
            map.__setTileTypesByPosYX([[3, 4], [4, 1], [5, 6], [6, 3],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 3], [1, 2], [2, 1], [3, 0], [3, 1],]);
                map.__placeAllyUnitsByPosYX([[6, 6], [6, 7], [7, 6], [8, 5], [9, 4],]);
            }
            break;
        case MapType.SummonersDuel_MountainPass:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [8, 6], [8, 7], [9, 4], [9, 5], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[0, 4], [0, 7], [2, 0], [2, 1], [3, 4], [3, 7], [4, 0], [4, 1], [5, 6], [5, 7], [6, 0], [6, 3], [7, 6], [7, 7], [9, 0], [9, 3],], TileType.Flier);
            map.__setTileTypesByPosYX([[4, 4], [5, 3],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[7, 0], [8, 0], [8, 1], [9, 1], [9, 2],]);
                map.__placeAllyUnitsByPosYX([[0, 5], [0, 6], [1, 6], [1, 7], [2, 7],]);
            }
            break;
        case MapType.SummonersDuel_Bridges:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__placeBreakableWallsByPosYX([[1, 2], [1, 3], [2, 0], [7, 7], [8, 4], [8, 5],], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([[2, 3], [4, 5], [5, 2], [7, 4],], TileType.Forest);
            map.__setTileTypesByPosYX([[0, 2], [0, 3], [0, 5], [0, 6], [0, 7], [1, 7], [4, 1], [5, 6], [8, 0], [9, 0], [9, 1], [9, 2], [9, 4], [9, 5],], TileType.Flier);
            map.__setTileTypesByPosYX([[3, 4], [6, 3],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 4], [1, 5], [1, 6], [2, 7], [3, 7],]);
                map.__placeAllyUnitsByPosYX([[6, 0], [7, 0], [8, 1], [8, 2], [9, 3],]);
            }
            break;
        // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR014
        case MapType.SummonersDuel_ShiftingSands:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[3, 2], [6, 5],], TileType.Forest);
            map.__setTileTypesByPosYX([[0, 7], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [3, 5], [6, 2], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [7, 7], [9, 0],], TileType.Flier);
            map.__setTileTypesByPosYX([[4, 2], [5, 5],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 5], [1, 5], [1, 6], [2, 6], [2, 7],]);
                map.__placeAllyUnitsByPosYX([[7, 0], [7, 1], [8, 1], [8, 2], [9, 2],]);
            }
            break;
        // https://feheroes.fandom.com/wiki/Template:MapLayout_ZR006
        case MapType.SummonersDuel_DesertTrees:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [2, 4], [7, 3], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[0, 2], [0, 6], [1, 7], [2, 0], [2, 3], [4, 3], [5, 4], [7, 4], [7, 7], [8, 0], [9, 1], [9, 5],], TileType.Forest);
            map.__setTileTypesByPosYX([[0, 7], [3, 5], [6, 2], [9, 0],], TileType.Flier);
            map.__setTileTypesByPosYX([[4, 1], [5, 6],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [1, 6], [2, 7], [3, 7],]);
                map.__placeAllyUnitsByPosYX([[6, 0], [7, 0], [8, 1], [9, 2], [9, 3],]);
            }
            break;
        case MapType.SummonersDuel_1:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[0, 2], [3, 3], [4, 7], [5, 0], [6, 4], [9, 5],], TileType.Forest);
            map.__setTileTypesByPosYX([[2, 0], [2, 1], [2, 3], [2, 4], [3, 0], [3, 4], [6, 3], [6, 7], [7, 3], [7, 4], [7, 6], [7, 7],], TileType.Flier);
            map.__setTileTypesByPosYX([[3, 2], [6, 5],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 5], [1, 5], [1, 6], [2, 6], [2, 7],]);
                map.__placeAllyUnitsByPosYX([[7, 0], [7, 1], [8, 1], [8, 2], [9, 2],]);
            }
            break;
        case MapType.SummonersDuel_2:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [0, 2], [0, 3], [0, 6], [0, 7], [1, 0], [1, 1], [3, 1], [3, 3], [6, 4], [6, 6], [8, 6], [8, 7], [9, 0], [9, 1], [9, 4], [9, 5], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[3, 0], [3, 4], [3, 6], [6, 1], [6, 3], [6, 7],], TileType.Forest);
            map.__setTileTypesByPosYX([[4, 4], [5, 3],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 5], [1, 5], [1, 6], [2, 6], [2, 7],]);
                map.__placeAllyUnitsByPosYX([[7, 0], [7, 1], [8, 1], [8, 2], [9, 2],]);
            }
            break;
        case MapType.SummonersDuel_3:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [0, 2], [0, 3], [0, 7], [1, 0], [1, 1], [1, 2], [1, 7], [2, 0], [2, 1], [2, 7], [3, 0], [3, 7], [6, 0], [6, 7], [7, 0], [7, 6], [7, 7], [8, 0], [8, 5], [8, 6], [8, 7], [9, 0], [9, 4], [9, 5], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[3, 3], [4, 5], [5, 2], [6, 4],], TileType.Forest);
            map.__setTileTypesByPosYX([[2, 2], [7, 5],], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 4], [0, 5], [0, 6], [1, 5], [2, 5],]);
                map.__placeAllyUnitsByPosYX([[7, 2], [8, 2], [9, 1], [9, 2], [9, 3],]);
            }
            break;
        case MapType.SummonersDuel_7:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__placeBreakableWallsByPosYX([[4, 3], [4, 4], [5, 3], [5, 4],], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([[0, 2], [0, 3], [0, 4], [1, 2], [2, 0], [2, 1], [3, 0], [4, 0], [5, 7], [6, 7], [7, 6], [7, 7], [8, 5], [9, 3], [9, 4], [9, 5],], TileType.Flier);
            map.__setTileTypesByPosYX([[3, 2], [6, 5],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 5], [1, 5], [1, 6], [2, 6], [2, 7],]);
                map.__placeAllyUnitsByPosYX([[7, 0], [7, 1], [8, 1], [8, 2], [9, 2],]);
            }
            break;
        case MapType.SummonersDuel_8:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [1, 0], [1, 1], [1, 2], [8, 5], [8, 6], [8, 7], [9, 0], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[3, 2], [3, 3], [3, 5], [4, 5], [5, 2], [6, 2], [6, 4], [6, 5],], TileType.Flier);
            map.__setTileTypesByPosYX([[2, 2], [7, 5],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[1, 6], [2, 7], [4, 7], [6, 7], [7, 7],]);
                map.__placeAllyUnitsByPosYX([[2, 0], [3, 0], [5, 0], [7, 0], [8, 1],]);
            }
            break;
        case MapType.SummonersDuel_9:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__placeBreakableWallsByPosYX([[4, 3], [5, 4],], BreakableWallIconType.Wall);
            map.__setTileTypesByPosYX([[0, 7], [1, 7], [8, 0], [9, 0],], TileType.Forest);
            map.__setTileTypesByPosYX([[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [2, 0], [3, 0], [3, 2], [4, 0], [5, 7], [6, 5], [6, 7], [7, 7], [8, 4], [8, 5], [9, 3], [9, 4], [9, 5],], TileType.Flier);
            map.__setTileTypesByPosYX([[4, 2], [5, 5],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 5], [1, 5], [1, 6], [2, 6], [2, 7],]);
                map.__placeAllyUnitsByPosYX([[7, 0], [7, 1], [8, 1], [8, 2], [9, 2],]);
            }
            break;
        case MapType.SummonersDuel_10:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [0, 3], [1, 0], [1, 1], [4, 7], [5, 0], [8, 6], [8, 7], [9, 4], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[0, 2], [0, 4], [0, 6], [0, 7], [1, 7], [2, 3], [3, 3], [3, 7], [4, 5], [5, 2], [6, 0], [6, 4], [7, 4], [8, 0], [9, 0], [9, 1], [9, 3], [9, 5],], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 5], [1, 5], [1, 6], [2, 6], [2, 7],]);
                map.__placeAllyUnitsByPosYX([[7, 0], [7, 1], [8, 1], [8, 2], [9, 2],]);
            }
            break;
        case MapType.SummonersDuel_11:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[3, 3], [6, 4],], TileType.Forest);
            map.__setTileTypesByPosYX([[0, 2], [0, 3], [0, 6], [0, 7], [1, 7], [2, 3], [3, 1], [6, 6], [7, 4], [8, 0], [9, 0], [9, 1], [9, 4], [9, 5],], TileType.Flier);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 5], [1, 5], [1, 6], [2, 6], [2, 7],]);
                map.__placeAllyUnitsByPosYX([[7, 0], [7, 1], [8, 1], [8, 2], [9, 2],]);
            }
            break;
        case MapType.SummonersDuel_12:
            map.__placeWallsByPosYX([[0, 0], [0, 1], [1, 0], [1, 1], [8, 6], [8, 7], [9, 6], [9, 7],]);
            map.__setTileTypesByPosYX([[0, 2], [0, 3], [0, 6], [0, 7], [1, 7], [2, 3], [2, 4], [3, 1], [3, 6], [4, 3], [4, 6], [5, 1], [5, 4], [6, 1], [6, 6], [7, 3], [7, 4], [8, 0], [9, 0], [9, 1], [9, 4], [9, 5],], TileType.Flier);
            map.__setTileTypesByPosYX([[4, 1], [5, 6],], TileType.Trench);
            if (withUnits) {
                map.__placeElemyUnitsByPosYX([[0, 4], [1, 5], [1, 6], [2, 6], [3, 7],]);
                map.__placeAllyUnitsByPosYX([[6, 0], [7, 1], [8, 1], [8, 2], [9, 3],]);
            }
            break;
        default:
            return;
    }

    // 壁が配置されてると壁が表示されてしまうので、英雄決闘の状態表示部分だけWallタイプに変更
    map.__convertTilesPlacedWallToWallTileTypeByPosYx([
        [0, 0], [0, 1],
        [1, 0], [1, 1],
        [8, 6], [8, 7],
        [9, 6], [9, 7],
    ]);
}

function __resetBattleMapPlacement(map, type, withUnits) {
    if (type === MapType.None) {
        return;
    }

    if (isAetherRaidMap(type)) {
        __resetBattleMapPlacementForAetherRaid(map, type);
        return;
    }
    if (isArenaMap(type)) {
        __resetBattleMapPlacementForArena(map, type, withUnits);
        return;
    }
    if (isResonantBattlesMap(type)) {
        __resetBattleMapPlacementForResonantBattles(map, type, withUnits);
        return;
    }
    if (isTempestTrialsMap(type)) {
        __resetBattleMapPlacementForTempestTrials(map, type, withUnits);
        return;
    }
    if (isSummonerDuelsMap(type)) {
        __resetBattleMapPlacementForSummonerDuels(map, type, withUnits);
        return;
    }
}

/**
 * マップの配置をリセットします。
 * @param  {BattleMap} map
 * @param  {MapType} type
 * @param  {Boolean} withUnits=false
 */
function resetBattleMapPlacement(map, type, withUnits = false) {
    map.__clearTiles();
    __resetBattleMapPlacement(map, type, withUnits);
}
