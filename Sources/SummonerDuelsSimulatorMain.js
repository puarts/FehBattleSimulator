/// @file
/// @brief シミュレーターのメインコードです。

/// シミュレーター本体です。
class SummonerDuelsSimulator extends BattleSimmulatorBase {
    constructor() {
        super();
    }

    simulateBeginningOfTurn() {
        if (g_appData.currentTurn == this.vm.maxTurn) {
            return;
        }
        let self = this;
        this.__enqueueCommand("ターン開始", function () {
            g_appData.globalBattleContext.currentPhaseType = UnitGroupType.Ally;
            ++g_appData.globalBattleContext.currentTurn;
            if (g_appData.currentTurn == 1) {
                // 戦闘開始
                for (let unit of g_appData.units) {
                    unit.resetAllState();
                }
            }
            self.audioManager.playSoundEffect(SoundEffectId.PlayerPhase);
            self.__simulateBeginningOfTurn(self.__getOnMapAllyUnitList());
        });
    }

    /**
     * @param  {Unit} targetUnit
     */
    endUnitAction(targetUnit) {
        targetUnit.endAction();
        let hasAnyAction = this.__hasAnyActions(this.enumerateUnitsInTheSameGroupOnMap(targetUnit));
        let endsCurrentPhase = !hasAnyAction;
        this.data.globalBattleContext.gainSummonerDuelsPhase(endsCurrentPhase);
        if (this.data.globalBattleContext.isSummonerDuelsTurnEnded) {
            this.simulateBeginningOfTurn();
        }
        else {
            updateAllUi();
        }
    }
    /**
     * @param  {Unit[]} units
     */
    __hasAnyActions(units) {
        for (let unit of units) {
            if (!unit.isActionDone || this.canActivateDuoSkillOrHarmonizedSkill(unit)) {
                return true;
            }
        }
        return false;
    }
}

let g_app = new SummonerDuelsSimulator();

function initAetherRaidBoard(
    heroInfos
) {
    using(new ScopedStopwatch(time => g_app.writeDebugLogLine("マップの初期化: " + time + " ms")), () => {
        g_appData.setGameMode(GameMode.SummonerDuels);
        resetPlacement();

        // 全ユニットをアルフォンスで初期化(名前が変わらない事があるので一旦コメントアウト)
        // let defaultHeroIndex = 18;
        // g_app.resetUnits(defaultHeroIndex);
    });

    using(new ScopedStopwatch(time => g_app.writeDebugLogLine("保存状態の復元: " + time + " ms")), () => {
        // g_app.resetUnitsForTesting();
        loadSettings();
        g_appData.setGameMode(GameMode.SummonerDuels);
    });
}
