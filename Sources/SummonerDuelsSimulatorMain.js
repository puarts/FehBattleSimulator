/// @file
/// @brief シミュレーターのメインコードです。

import { BattleSimulatorBase, resetPlacement, loadSettings, updateAllUi } from './BattleSimulatorBase.js';
import { ScopedStopwatch, using_ } from './Utilities.js';
import { g_appData } from './AppData.js';
import { GameMode } from './DamageCalculator.js';
import { UnitGroupType } from './UnitConstants.js';
import { SoundEffectId } from './AudioManager.js';
import { weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos } from './SampleSkillInfos.js';
import { heroInfos } from './SampleHeroInfos.js';
import { initVueComponents } from './VueComponents.js';

// Side-effect imports for skill registration
import './SkillEffectCore.js';
import './SkillEffectEnv.js';
import './SkillEffect.js';
import './SkillEffectField.js';
import './SkillEffectUnit.js';
import './SkillEffectBattleContext.js';
import './SkillEffectHooks.js';
import './SkillEffectRegistrar.js';
import './SkillEffectAliases.js';
import './CustomSkill.js';
import './SkillImpl.js';
import './SkillImpl202408.js';
import './SkillImpl202501.js';
import './SkillImpl202601.js';

/// シミュレーター本体です。
class SummonerDuelsSimulator extends BattleSimulatorBase {
    constructor() {
        super();
    }

    simulateBeginningOfTurn() {
        if (g_appData.currentTurn === this.vm.maxTurn) {
            return;
        }
        let self = this;
        this.__enqueueCommand("ターン開始", function () {
            ++g_appData.globalBattleContext.currentTurn;
            if (g_appData.currentTurn === 1) {
                // 戦闘開始
                for (let unit of g_appData.units) {
                    unit.resetAllState();
                }
            } else {
                self.data.globalBattleContext.addSummonerDuelsCaptureScore(
                    self.__getUnitsOnPointArea(UnitGroupType.Ally),
                    self.__getUnitsOnPointArea(UnitGroupType.Enemy));
            }
            self.data.isDisplayingMapMessage = true;
            self.audioManager.playSoundEffect(SoundEffectId.PlayerPhase);
            let allUnitsOnMap = self.__getUnits(x => x.isOnMap);
            self.__simulateBeginningOfTurn(allUnitsOnMap, allUnitsOnMap);
            const displayingMessageMilliseconds = 2500;
            setTimeout(() => {
                self.data.isDisplayingMapMessage = false;
            }, displayingMessageMilliseconds);
        });
    }

    __getUnitsOnPointArea(groupId) {
        return this.__getUnits(x =>
            x.isOnMap
            && x.groupId === groupId
            && this.map.isUnitOnSummonerDuelsPointArea(x, this.data.globalBattleContext.summonerDuelsPointAreaOffset));
    }

    endSummonerDuelsTurn() {
        this.data.globalBattleContext.endSummonerDuelsTurn();
        if (this.data.globalBattleContext.isSummonerDuelsTurnEnded) {
            this.simulateBeginningOfTurn();
            this.__executeAllCommands(this.commandQueuePerAction, 0);
        }
        updateAllUi();
    }

    __goToNextPhaseIfPossible(groupId) {
        if (this.__isCantoAtionActivatable(this.enumerateUnitsOnMap(x => x.groupId == groupId))) {
            // 再移動発動中のユニットがいる場合はフェーズを切り替えない
            return;
        }

        let endsCurrentPhase = !this.__hasAnyActions(this.enumerateUnitsOnMap(x => x.groupId == groupId));
        this.data.globalBattleContext.gainSummonerDuelsPhase(endsCurrentPhase);
        if (this.data.globalBattleContext.isSummonerDuelsTurnEnded) {
            this.simulateBeginningOfTurn();
        }
        updateAllUi();
    }
    /**
     * @param  {Unit[]} units
     * @returns {Boolean}
     */
    __isCantoAtionActivatable(units) {
        for (let unit of units) {
            if (unit.isCantoActivated()) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param  {Unit[]} units
     * @returns {Boolean}
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
    using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("マップの初期化: " + time + " ms")), () => {
        g_appData.setGameMode(GameMode.SummonerDuels);
        resetPlacement();

        // 全ユニットをアルフォンスで初期化(名前が変わらない事があるので一旦コメントアウト)
        // let defaultHeroIndex = 18;
        // g_app.resetUnits(defaultHeroIndex);
    });

    using_(new ScopedStopwatch(time => g_app.writeDebugLogLine("保存状態の復元: " + time + " ms")), () => {
        // g_app.resetUnitsForTesting();
        g_appData.isPairUpBoostsEnabled = true;
        loadSettings();
        if (g_appData.gameMode != GameMode.SummonerDuels) {
            g_appData.setGameMode(GameMode.SummonerDuels);
            resetPlacement();
        }
    });
}

// Initialization
window.g_app = g_app;
initVueComponents();
g_app.registerSkillOptions(weaponInfos, supportInfos, specialInfos, passiveAInfos, passiveBInfos, passiveCInfos, passiveXInfos, passiveSInfos, captainInfos, true);
g_app.registerHeroOptions(heroInfos, false);
initAetherRaidBoard(heroInfos);
if (typeof window.createDialogs === 'function') window.createDialogs();
if (typeof window.importUrl === 'function') window.importUrl(location.search);

export { SummonerDuelsSimulator, g_app, initAetherRaidBoard };
