#include <gtest/gtest.h>
#include "Map.h"
#include <chrono>

using namespace FehBattleSimulatorLib;
TEST(TestCaseName, GetMoveWeight) {
    Map map(3, 3);
    Unit unit;
    auto tile = map.GetTile(0, 0);
    int weight = tile->GetMoveWeight(&unit, false);
    EXPECT_EQ(1, weight);
}

TEST(TestCaseName, GetMovableNeighborTiles) {
    Map map(3, 3);
    map.GetTile(0, 1)->SetTileType(TileType::Flier);

    Unit unit;
    unit.moveType = MoveType::Infantry;
    auto tile = map.GetTile(0, 0);
    {
        std::vector<Tile*>* result = tile->GetMovableNeighborTiles(&unit, 1);
        EXPECT_EQ(2, result->size());
        delete result;
    }
    {
        std::vector<Tile*>* result = tile->GetMovableNeighborTiles(&unit, 2);
        EXPECT_EQ(4, result->size());
        delete result;
    }
    {
        std::vector<Tile*>* result = tile->GetMovableNeighborTiles(&unit, 3);
        EXPECT_EQ(6, result->size());
        delete result;
    }
}
