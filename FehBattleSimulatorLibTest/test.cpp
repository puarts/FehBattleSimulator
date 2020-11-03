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
