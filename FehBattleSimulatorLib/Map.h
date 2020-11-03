#pragma once

#include "Define.h"
#include "Tile.h"

#define MAX_MAP_WIDTH 8
#define MAX_MAP_HEIGHT 10

namespace FehBattleSimulatorLib {

    class FEHBATTLESIMULATORLIB_API Map
    {
    public:
        Map(int width, int height)
            : _width(width)
            , _height(height)
        {
            Resize(width, height);
        }

        void Resize(int width, int height);

        Tile* GetTile(int x, int y)
        {
            return &_tiles[y * MAX_MAP_WIDTH + x];
        }

        Tile _tiles[MAX_MAP_HEIGHT * MAX_MAP_WIDTH];
        int _width;
        int _height;
    };
}