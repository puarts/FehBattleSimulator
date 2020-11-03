#pragma once

#include "Define.h"
#include "Unit.h"

namespace FehBattleSimulatorLib {

    enum
    {
        CanNotReachTile = 1000000,
        ObstructTile = 10000,
    };

    enum class TileType
    {
        Normal = 0,
        Forest = 1,
        Flier = 2,
        Trench = 3,
        Wall = 4,
        DefensiveTile = 5,
        DefensiveTrench = 6,
        DefensiveForest = 7,
    };

    class FEHBATTLESIMULATORLIB_API Tile
    {
    public:
        Tile();
        Tile(TileType type);

        int GetMoveWeight(const Unit* unit, bool ignoresUnits, bool ignoresBreakableWalls = false, bool(*isUnitIgnoredFunc)(Unit*) = nullptr);
        void SetNeighbors(Tile** tiles, int length);
        void SetTileType(TileType type);
        void SetPos(int x, int y);
        void AddNeighbor(Tile* tile);
        void SetUnit(Unit* unit);

    private:
        class Impl;
        Impl* _impl;
    };

}
