
#include "Tile.h"
#include "Structure.h"

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
    if (this->_impl->placedUnit != nullptr && isUnitIgnoredFunc != nullptr && !isUnitIgnoredFunc(this->_impl->placedUnit)) {
        // タイルのユニットを無視しないので障害物扱い
        return CanNotReachTile;
    }

    if (!ignoresUnits) {
        if (!unit->CanActivatePass())
        {
            if (this-> _impl->placedUnit != nullptr && unit->groupId != this->_impl->placedUnit->groupId) {
                // 敵ユニットだったらオブジェクトと同じ扱い
                return CanNotReachTile;
            }
            // 隣接マスに進軍阻止持ちがいるか確認
            for (int i = 0; i < this->_impl->neighborCount; ++i)
            {
                Tile* tile = this->_impl->neighbors[i];
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

    int weight = this->_impl->__getTileMoveWeight(unit);
    if (weight != CanNotReachTile) {
        if (unit->weapon == Weapon::FujinYumi && unit->isWeaponRefined && unit->hpPercentage >= 50) {
            weight = 1;
        }
    }
    if (this->_impl->obj == nullptr) {
        return weight;
    }

    if (this->_impl->obj->isTrap) {
        return weight;
    }

    if (ignoresBreakableWalls) {
        if (!this->_impl->obj->isBreakable) {
            return CanNotReachTile;
        }

        if (this->_impl->obj->isBreakableWall) {
            return weight;
        }

        if (unit->groupId == UnitGroupType::Ally) {
            if (this->_impl->obj->isDefenceStructure) {
                return weight;
            }
        }
        else {
            if (this->_impl->obj->isOffenceStructure) {
                return weight;
            }
        }
    }

    return CanNotReachTile;
}

