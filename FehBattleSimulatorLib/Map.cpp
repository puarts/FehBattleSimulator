
#include "Map.h"

using namespace FehBattleSimulatorLib;

void Map::Resize(int width, int height)
{
    _width = width;
    _height = height;
    for (int y = 0; y < _height; ++y)
    {
        for (int x = 0; x < _width; ++x)
        {
            Tile* tile = GetTile(x, y);
            tile->SetPos(x, y);

            if (x + 1 < this->_width) {
                tile->AddNeighbor(this->GetTile(x + 1, y));
            }
            if (x - 1 >= 0) {
                tile->AddNeighbor(this->GetTile(x - 1, y));
            }
            if (y + 1 < this->_height) {
                tile->AddNeighbor(this->GetTile(x, y + 1));
            }
            if (y - 1 >= 0) {
                tile->AddNeighbor(this->GetTile(x, y - 1));
            }
        }
    }
}

