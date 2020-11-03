#pragma once

#include "Define.h"


namespace FehBattleSimulatorLib {
    class FEHBATTLESIMULATORLIB_API Structure
    {
    public:
        Structure()
            : isBreakable(false)
        {
        }

        bool isBreakable;
        bool isBreakableWall;
        bool isTrap;
        bool isDefenceStructure;
        bool isOffenceStructure;
    };

}
