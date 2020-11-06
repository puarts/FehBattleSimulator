
#include "Tile.h"
#include "Structure.h"

#include <map>
#include <vector>
#include <string>

using namespace FehBattleSimulatorLib;

class Tile::Impl
{
public:
    Impl()
        : _type(TileType::Normal)
    {
        SetMoveWeightsFromTileType();
    }

    Impl(TileType type)
        : neighborCount(0)
        , _type(type)
    {
        SetMoveWeightsFromTileType();
    }

    int __getTileMoveWeight(const Unit* unit)
    {
        if (this->__isForestType() && unit->moveType == MoveType::Infantry && unit->moveCount == 1) {
            // 歩行に1マス移動制限がかかっている場合は森地形のウェイトは通常地形と同じ
            return 1;
        }

        return this->_moveWeights[(int)unit->moveType];
    }

    bool __isForestType()
    {
        return this->_type == TileType::Forest || this->_type == TileType::DefensiveForest;
    }


    void SetTileType(TileType type)
    {
        this->_type = type;
        SetMoveWeightsFromTileType();
    }

    void SetMoveWeightsFromTileType()
    {
        switch (_type) {
        case TileType::Normal:
        case TileType::DefensiveTile:
            this->_moveWeights[(int)MoveType::Cavalry] = 1;
            this->_moveWeights[(int)MoveType::Flying] = 1;
            this->_moveWeights[(int)MoveType::Armor] = 1;
            this->_moveWeights[(int)MoveType::Infantry] = 1;
            break;
        case TileType::Trench:
        case TileType::DefensiveTrench:
            this->_moveWeights[(int)MoveType::Cavalry] = 3;
            this->_moveWeights[(int)MoveType::Flying] = 1;
            this->_moveWeights[(int)MoveType::Armor] = 1;
            this->_moveWeights[(int)MoveType::Infantry] = 1;
            break;
        case TileType::Flier:
            this->_moveWeights[(int)MoveType::Cavalry] = CanNotReachTile;
            this->_moveWeights[(int)MoveType::Flying] = 1;
            this->_moveWeights[(int)MoveType::Armor] = CanNotReachTile;
            this->_moveWeights[(int)MoveType::Infantry] = CanNotReachTile;
            break;
        case TileType::Forest:
        case TileType::DefensiveForest:
            this->_moveWeights[(int)MoveType::Cavalry] = CanNotReachTile;
            this->_moveWeights[(int)MoveType::Flying] = 1;
            this->_moveWeights[(int)MoveType::Armor] = 1;
            this->_moveWeights[(int)MoveType::Infantry] = 2;
            break;
        case TileType::Wall:
            this->_moveWeights[(int)MoveType::Cavalry] = CanNotReachTile;
            this->_moveWeights[(int)MoveType::Flying] = CanNotReachTile;
            this->_moveWeights[(int)MoveType::Armor] = CanNotReachTile;
            this->_moveWeights[(int)MoveType::Infantry] = CanNotReachTile;
            break;
        default:
            break;
        }
    }

    int GetId()const
    {
        return this->_posX + this->_posY * 100;
    }

    std::vector<Tile*>* GetMovableNeighborTiles(Tile* self, const Unit* unit,
        int maxDepth, bool ignoresUnits = false, bool ignoreWeightsExceptCanNotReach = false)
    {
        std::vector<Tile*>* result = new std::vector<Tile*>();
        result->reserve(MAX_TILE_COUNT);
        result->push_back(self);
        std::map<int, int> tracedDepthDict;
        tracedDepthDict[this->GetId()] = -1;
        GetNeighborTilesImpl(*result, unit, maxDepth, false, ignoreWeightsExceptCanNotReach, ignoresUnits, tracedDepthDict);
        return result;
    }

    void GetNeighborTilesImpl(
        std::vector<Tile*>& result,
        const Unit* unit,
        int maxDepth,
        bool ignoreWeights,
        bool ignoreWeightsExceptCanNotReach,
        bool ignoresUnits,
        std::map<int, int>& tracedDepthDict,
        int currentDepth = 0
    ) {
        for (int i = 0; i < neighborCount; ++i) {
            Tile* neighborTile = neighbors[i];
            int key = neighborTile->GetId();
            bool hasKey = tracedDepthDict.find(key) != tracedDepthDict.end();
            if (hasKey) {
                int oldDepth = tracedDepthDict[key];
                if (oldDepth <= currentDepth) {
                    continue;
                }
            }

            int weight = 1;
            if (ignoreWeights == false) {
                weight = neighborTile->GetMoveWeight(unit, ignoresUnits, false);
            }

            bool isObstructTile = weight == ObstructTile;
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

            int nextDepth = currentDepth + weight;
            if (nextDepth > maxDepth) {
                continue;
            }

            tracedDepthDict[key] = currentDepth;
            if (!hasKey) {
                result.push_back(neighborTile);
            }
            if (isObstructTile) {
                continue;
            }

            neighborTile->_impl->GetNeighborTilesImpl(
                result, unit, maxDepth, ignoreWeights, ignoreWeightsExceptCanNotReach, ignoresUnits,
                tracedDepthDict, nextDepth);
        }
    }


    int GetMoveWeight(const Unit* unit, bool ignoresUnits, bool ignoresBreakableWalls, bool(*isUnitIgnoredFunc)(Unit*))
    {
        if (this->placedUnit != nullptr && isUnitIgnoredFunc != nullptr && !isUnitIgnoredFunc(this->placedUnit)) {
            // タイルのユニットを無視しないので障害物扱い
            return CanNotReachTile;
        }

        if (!ignoresUnits) {
            if (!unit->CanActivatePass())
            {
                if (this->placedUnit != nullptr && unit->groupId != this->placedUnit->groupId) {
                    // 敵ユニットだったらオブジェクトと同じ扱い
                    return CanNotReachTile;
                }
                // 隣接マスに進軍阻止持ちがいるか確認
                for (int i = 0; i < this->neighborCount; ++i)
                {
                    Tile* tile = this->neighbors[i];
                    if (tile->_impl->placedUnit != nullptr
                        && tile->_impl->placedUnit->groupId != unit->groupId
                        && (
                            (tile->_impl->placedUnit->passiveB == PassiveB::ShingunSoshi3 && tile->_impl->placedUnit->hpPercentage >= 50)
                            || (tile->_impl->placedUnit->passiveS == (int)PassiveS::GoeiNoGuzo && unit->attackRange == 2)
                            )
                        ) {
                        return ObstructTile;
                    }
                }
            }
        }

        int weight = this->__getTileMoveWeight(unit);
        if (weight != CanNotReachTile) {
            if (unit->weapon == Weapon::FujinYumi && unit->isWeaponRefined && unit->hpPercentage >= 50) {
                weight = 1;
            }
        }
        if (this->obj == nullptr) {
            return weight;
        }

        if (this->obj->isTrap) {
            return weight;
        }

        if (ignoresBreakableWalls) {
            if (!this->obj->isBreakable) {
                return CanNotReachTile;
            }

            if (this->obj->isBreakableWall) {
                return weight;
            }

            if (unit->groupId == UnitGroupType::Ally) {
                if (this->obj->isDefenceStructure) {
                    return weight;
                }
            }
            else {
                if (this->obj->isOffenceStructure) {
                    return weight;
                }
            }
        }

        return CanNotReachTile;
    }


    Unit* placedUnit;
    Structure* obj;
    Tile* neighbors[4];
    int neighborCount;
    int _moveWeights[4];
    TileType _type;
    int _posX;
    int _posY;
};

Tile::Tile()
    : _impl(new Impl())
{
}

Tile::Tile(TileType type)
    : _impl(new Impl(type))
{
}

void Tile::SetTileType(TileType type)
{
    this->_impl->SetTileType(type);
}

void Tile::SetPos(int x, int y)
{
    this->_impl->_posX = x;
    this->_impl->_posY = y;
}

int Tile::GetId()const
{
    return this->_impl->GetId();
}

void Tile::SetNeighbors(Tile** tiles, int length)
{
    this->_impl->neighborCount = length;
    for (int i = 0; i < length; ++i)
    {
        this->_impl->neighbors[i] = tiles[i];
    }
}

void Tile::AddNeighbor(Tile* tile)
{
    this->_impl->neighbors[this->_impl->neighborCount] = tile;
    ++this->_impl->neighborCount;
}

void Tile::SetUnit(Unit* unit)
{
    this->_impl->placedUnit = unit;
}


int Tile::GetMoveWeight(const Unit* unit, bool ignoresUnits, bool ignoresBreakableWalls, bool(*isUnitIgnoredFunc)(Unit*))
{
    return this->_impl->GetMoveWeight(unit, ignoresUnits, ignoresBreakableWalls,  isUnitIgnoredFunc);
}

std::vector<Tile*>* Tile::GetMovableNeighborTiles(const Unit* unit,
    int maxDepth, bool ignoresUnits, bool ignoreWeightsExceptCanNotReach)
{
    return this->_impl->GetMovableNeighborTiles(this, unit, maxDepth, ignoresUnits, ignoreWeightsExceptCanNotReach);
}