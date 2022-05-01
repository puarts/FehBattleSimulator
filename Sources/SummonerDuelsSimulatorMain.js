/// @file
/// @brief シミュレーターのメインコードです。

/// シミュレーター本体です。
class SummonerDuelsSimulator extends BattleSimmulatorBase {
    constructor() {
        super();
    }

    /**
     * @param  {Unit[]} targetUnits
     */
    __simulateBeginningOfTurn(targetUnits) {
        g_appData.isCombatOccuredInCurrentTurn = false;

        if (targetUnits.length == 0) {
            return;
        }

        g_appData.globalBattleContext.restOfPhaseCounts[UnitGroupType.Ally] = 6;
        g_appData.globalBattleContext.restOfPhaseCounts[UnitGroupType.Ally] = 6;

        let enemyUnits = Array.from(this.enumerateUnitsInDifferentGroupOnMap(targetUnits[0]));
        let allUnits = targetUnits.concat(enemyUnits);

        let group = targetUnits[0].groupId;
        for (let unit of allUnits) {
            unit.endAction();
            unit.deactivateCanto();
            unit.beginAction();
            // console.log(unit.getNameWithGroup() + ": moveCount=" + unit.moveCount);

            // 比翼や双界スキル発動カウントリセット
            unit.isDuoOrHarmonicSkillActivatedInThisTurn = false;
            if (unit.heroIndex == Hero.YoungPalla
                || unit.heroIndex == Hero.DuoSigurd
                || unit.heroIndex == Hero.DuoEirika
                || unit.heroIndex == Hero.DuoSothis
            ) {
                if (this.isOddTurn) {
                    unit.duoOrHarmonizedSkillActivationCount = 0;
                }
            }
            else if (unit.heroIndex == Hero.SummerMia
                || unit.heroIndex == Hero.SummerByleth
                || unit.heroIndex == Hero.PirateVeronica
                || unit.heroIndex == Hero.DuoHilda
            ) {
                if (g_appData.currentTurn % 3 == 1) {
                    unit.duoOrHarmonizedSkillActivationCount = 0;
                }
            }
        }

        // for (let unit of enemyUnits) {
        //     unit.endAction();
        //     unit.deactivateCanto();
        // }

        for (let unit of allUnits) {
            unit.resetOneTimeActionActivationStates();

            // 評価用のスナップショットを作成
            unit.createSnapshot();
        }

        this.__initReservedHpForAllUnitsOnMap();

        this.executeStructuresByUnitGroupType(group, false);

        // ターン開始時スキル(通常)
        for (let unit of allUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "のターン開始時発動スキルを適用..");
            this.beginningOfTurnSkillHandler.applySkillsForBeginningOfTurn(unit);
        }
        // ターン開始時効果(通常)による効果を反映
        this.beginningOfTurnSkillHandler.applyReservedStateForAllUnitsOnMap();

        // ターン開始時スキル(回復・ダメージ)
        for (let unit of allUnits) {
            this.writeDebugLogLine(unit.getNameWithGroup() + "のターン開始時発動HPスキルを適用..");
            this.beginningOfTurnSkillHandler.applyHpSkillsForBeginningOfTurn(unit);
        }
        // ターン開始時効果によるダメージや回復を反映
        this.beginningOfTurnSkillHandler.applyReservedHpForAllUnitsOnMap(true);

        this.writeLog(this.beginningOfTurnSkillHandler.log);

        for (let unit of allUnits) {
            unit.deleteSnapshot();
        }

        // 化身によりステータス変化する
        g_appData.__updateStatusBySkillsAndMergeForAllHeroes();

        // マップの更新(ターン開始時の移動マスの変化をマップに反映)
        g_appData.map.updateTiles();

        // ターンワイド状態の評価と保存
        {
            for (let unit of allUnits) {
                unit.clearPerTurnStatuses();

                // すり抜け状態の更新
                if (unit.canActivatePass()) {
                    unit.addPerTurnStatus(PerTurnStatusType.Pass);
                }

                // 敵への距離を更新
                this.__updateDistanceFromClosestEnemy(unit);
            }
            this.__updateMovementOrders(allUnits);
        }

        // 障害物リストの作成
        this.map.createTileSnapshots();

        // 脅威の評価
        this.__updateEnemyThreatStatusesForAll(targetUnits, enemyUnits);
        this.__updateEnemyThreatStatusesForAll(enemyUnits, targetUnits);

        this.__updateChaseTargetTiles(allUnits);

        // ターン開始時の移動値を記録
        for (let unit of this.enumerateAllUnitsOnMap(x => true)) {
            unit.moveCountAtBeginningOfTurn = unit.moveCount;
        }

        // 安全柵の効果が発動する場合でも、敵の移動をトリガーするかどうかの判定が行われている
        this.__prepareActionContextForAssist(targetUnits, enemyUnits, true);
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
