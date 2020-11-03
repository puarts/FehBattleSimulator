#pragma once

#include "Define.h"
#include "Skill.h"

namespace FehBattleSimulatorLib {
    enum class UnitGroupType
    {
        Ally = 0,
        Enemy = 1,
    };

    enum class MoveType {
        Infantry = 0,
        Flying = 1,
        Cavalry = 2,
        Armor = 3,
    };

    class FEHBATTLESIMULATORLIB_API Unit
    {
    public:
        Unit()
            : groupId(UnitGroupType::Ally)
            , weapon(Weapon::None)
            , passiveB(PassiveB::None)
            , passiveS(-1)
            , hpPercentage(100.0f)
            , attackRange(0)
            , isWeaponRefined(false)
            , moveType(MoveType::Infantry)
            , moveCount(1)
        {
        }

        bool CanActivatePass()const
        {
            return (this->passiveB == PassiveB::Surinuke3 && this->hpPercentage >= 25)
                || (this->weapon == Weapon::FujinYumi && !this->isWeaponRefined && this->hpPercentage >= 50);
        }

        UnitGroupType groupId;
        Weapon weapon;
        PassiveB passiveB;
        int passiveS;
        float hpPercentage;
        int attackRange;
        bool isWeaponRefined;
        MoveType moveType;
        int moveCount;
    };
}
