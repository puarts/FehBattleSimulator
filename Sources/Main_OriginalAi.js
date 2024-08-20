/// @file
/// @brief 自動攻略用のAIの実験実装です。

/// 自動攻略用AIの検証用クラスです。
class OriginalAi {

    __createBranchesFromCurrentState(currentNode) {
        let app = g_app;
        let self = this;
        for (let unit of app.enumerateAllyUnitsOnMap()) {
            if (unit.isActionDone) {
                continue;
            }
            using_(new ScopedStopwatch(time => app.writeErrorLine(`■${unit.getNameWithGroup()}の評価: ` + time + " ms")), () => {
                let commandCandidates = self.__createAllExecutableCommandsForUnit(unit);
                for (let commands of commandCandidates) {
                    if (commands.length == 0) {
                        continue;
                    }

                    let node = new TreeNode(commands);
                    currentNode.branches.push(node);

                    // 実行
                    // let serializedTurn = exportPerTurnSettingAsString();
                    for (let i = 0; i < commands.length; ++i) {
                        let command = commands[i];
                        using_(new ScopedStopwatch(time => app.writeErrorLine(`${command.label}: ` + time + " ms")), () => {
                            command.execute();
                        });
                    }
                    using_(new ScopedStopwatch(time => { app.writeErrorLine(`タイル更新: ` + time + " ms"); }), () => {
                        g_appData.map.updateMovableAndAttackableTilesForAllUnits();
                    });

                    // 次のブランチを作成
                    self.__createBranchesFromCurrentState(node);

                    // 状態を復元
                    for (let i = commands.length - 1; i >= 0; --i) {
                        let command = commands[i];
                        using_(new ScopedStopwatch(time => app.writeErrorLine(`undo ${command.label}: ` + time + " ms")), () => {
                            command.undo();
                        });
                    }

                    // importPerTurnSetting(serializedTurn);
                    break;
                }
            });
            break;
        }
    }

    executeRandomAction() {
        let app = g_app;
        let self = this;
        let acitonPatternCount = 1;
        using_(new ScopedStopwatch(time => app.writeDebugLogLine("コマンド実行: " + time + " ms")), () => {
            // self.disableAllLogs = true;
            app.vm.isCommandUndoable = true;
            let commandQueue = new CommandQueue(100);
            let rootNode = new TreeNode([]);
            let currentNode = rootNode;
            self.__createBranchesFromCurrentState(currentNode);

            // for (let node of currentNode.branches) {
            //     for (let command of node.item) {
            //         using_(new ScopedStopwatch(time => app.writeErrorLine(`${command.label}: ` + time + " ms")), () => {
            //             command.execute();
            //         });
            //         commandQueue.enqueue(command);
            //     }
            //     using_(new ScopedStopwatch(time => { app.writeErrorLine(`タイル更新: ` + time + " ms"); }), () => {
            //         g_appData.map.updateMovableAndAttackableTilesForAllUnits();
            //     });
            //     self.__createBranchesFromCurrentState(node);
            // }

            // self.__executeAllCommands(commandQueue, 0);
            app.disableAllLogs = false;
            app.vm.isCommandUndoable = true;
        });

        // self.writeDebugLogLine(`acitonPatternCount = ${acitonPatternCount}`);
        updateAllUi();
    }

    __createAllExecutableCommandsForUnit(targetUnit) {
        let self = g_app;
        let candidates = [];
        using_(new ScopedStopwatch(time => self.writeWarningLine(`コマンド作成トータル: ` + time + " ms")), () => {
            // 攻撃
            using_(new ScopedStopwatch(time => self.writeWarningLine(`攻撃コマンド列挙: ` + time + " ms")), () => {
                for (let unitAndTile of targetUnit.enumerateActuallyAttackableUnitAndTiles()) {
                    let unit = unitAndTile[0];
                    let tile = unitAndTile[1];
                    let commands = self.__createAttackCommands(targetUnit, unit, tile);
                    candidates.push(commands);
                }
            });

            // 施設破壊
            using_(new ScopedStopwatch(time => self.writeWarningLine(`施設破壊コマンド列挙: ` + time + " ms")), () => {
                for (let structureAndTile of targetUnit.enumerateActuallyBreakableStructureAndTiles()) {
                    let structure = structureAndTile[0];
                    let tile = structureAndTile[1];
                    let commands = self.__createBreakStructureCommands(targetUnit, tile, structure);
                    candidates.push(commands);
                }
            });

            // 補助
            using_(new ScopedStopwatch(time => self.writeWarningLine(`補助コマンド列挙: ` + time + " ms")), () => {
                for (let unitAndTile of targetUnit.enumerateActuallyAssistableUnitAndTiles()) {
                    let unit = unitAndTile[0];
                    let tile = unitAndTile[1];
                    if (self.__canSupportTo(targetUnit, unit, tile)) {
                        let commands = self.__createSupportCommands(targetUnit, tile, unit);
                        candidates.push(commands);
                    }
                }
            });

            // 移動
            using_(new ScopedStopwatch(time => self.writeWarningLine(`移動コマンド列挙: ` + time + " ms")), () => {
                for (let tile of targetUnit.enumerateMovableTiles(false)) {
                    let command = self.__createMoveCommand(targetUnit, tile, true);
                    candidates.push([command]);
                }
            });

            // 比翼スキル使用
            using_(new ScopedStopwatch(time => self.writeWarningLine(`比翼スキルコマンド列挙: ` + time + " ms")), () => {
                if (self.canActivateDuoSkillOrHarmonizedSkill(targetUnit)) {
                    let command = self.__createDuoSkillCommand(targetUnit);
                    candidates.push([command]);
                }
            });
        });

        return candidates;
    }

    __origAi_simulate() {
        let self = g_app;
        let targetGroup = UnitGroupType.Ally;
        let enemyGroup = UnitGroupType.Enemy;
        if (self.vm.globalBattleContext.currentPhaseType == enemyGroup) {
            return false;
        }

        let enemyUnits = self.__getUnits(unit =>
            unit.isOnMap
            && unit.groupId == enemyGroup);

        // self.tempSerializedTurn = exportPerTurnSettingAsString();

        // let currentTurn = g_appData.currentTurn;
        // self.isTurnWideCommandQueueEnabled = true;
        // for (let i = 0; i < 100; ++i) {
        let isActionExecuted = this.__origAi_simulateAttackerAction(targetGroup, enemyUnits);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        isActionExecuted = this.__origAi_simulateRefreshAction(targetGroup);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        isActionExecuted = this.__origAi_simulateSmiteAction(targetGroup);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        // break;
        // }
        // self.isTurnWideCommandQueueEnabled = false;

        // g_appData.currentTurn = currentTurn;
        // importPerTurnSetting(self.tempSerializedTurn);
        // self.__executeAllCommands(self.commandQueue, 100);

        return self.__simulateAllyActionCustomized();
    }

    __origAi_simulateSmiteAction(targetGroup) {
        let self = g_app;
        let assisters = [];
        for (let unit of self.enumerateAllUnitsOnMap(x =>
            x.groupId == targetGroup
            && !x.isActionDone
            && x.support == Support.Smite)
        ) {
            unit.actionContext.clear();
            assisters.push(unit);
        }

        let attackers = this.__origAi_getAttackers(targetGroup);

        for (let assistUnit of assisters) {
            self.__setBestTargetAndTiles(
                assistUnit,
                true,
                (targetUnit, tile) => {
                    if (targetUnit.isActionDone) {
                        return false;
                    }

                    if (attackers.includes(targetUnit)) {
                        let result = self.__findTileAfterSmite(assistUnit, targetUnit, tile);
                        if (!result.success) {
                            return false;
                        }

                        if (result.targetUnitTileAfterAssist.obj instanceof TrapBase) {
                            return false;
                        }

                        // ぶちかまし後に敵を攻撃可能になるならtrue
                        for (let enemy of self.enumerateEnemyUnitsOnMap()) {
                            if (self.map.examinesCanAttack(
                                targetUnit,
                                enemy,
                                false,
                                result.targetUnitTileAfterAssist,
                                x => x.obj instanceof TrapBase)
                            ) {
                                return true;
                            }
                        }
                        return false;
                    }
                    else if (targetUnit.supportInfo.assistType === AssistType.Refresh) {
                        let result = self.__findTileAfterSmite(assistUnit, targetUnit, tile);
                        if (!result.success) {
                            return false;
                        }

                        if (result.targetUnitTileAfterAssist.obj instanceof TrapBase) {
                            return false;
                        }

                        // 行動済みのアタッカーを再行動できるか
                        let actionedAttackers = self.enumerateAllUnitsOnMap(x =>
                            x.groupId === targetGroup
                            && x.isActionDone
                            && x.supportInfo.assistType !== AssistType.Refresh
                            // TODO: AIを確認
                            && x.support !== Support.Smite);
                        for (let attacker of actionedAttackers) {
                            let dist = attacker.placedTile.calculateUnitMovementCountToThisTile(
                                targetUnit, result.targetUnitTileAfterAssist);
                            if (dist - 1 <= targetUnit.moveCount) {
                                return true;
                            }
                        }

                        return false;
                    }

                    return false;
                },
                tile => !(tile.obj instanceof TrapBase)
            );
            if (assistUnit.actionContext.bestTargetToAssist == null) {
                self.writeDebugLogLine(assistUnit.getNameWithGroup() + "の補助可能な味方がいない");
                continue;
            }

            let bestTargetToAssist = assistUnit.actionContext.bestTargetToAssist;
            let bestTileToAssist = assistUnit.actionContext.bestTileToAssist;

            self.__enqueueSupportCommand(assistUnit, bestTileToAssist, bestTargetToAssist);
            return true;
        }

        return false;
    }

    * __origAi_enumerateAttackersAndRefreshers(targetGroup) {
        for (let unit of this.__origAi_getRefreshers(targetGroup)) {
            yield unit;
        }
        for (let unit of this.__origAi_getAttackers(targetGroup)) {
            yield unit;
        }
    }

    __origAi_getRefreshers(targetGroup) {
        let self = g_app;
        /** @type {Unit[]} */
        let assisterArray = [];
        /** @type {Generator<Unit>} */
        let assisters = self.enumerateAllUnitsOnMap(x =>
            x.groupId === targetGroup
            && !x.isActionDone
            && x.supportInfo.assistType === AssistType.Refresh);
        for (let unit of assisters) {
            unit.actionContext.clear();
            assisterArray.push(unit);
        }
        return assisterArray;
    }

    __origAi_simulateRefreshAction(targetGroup) {
        let self = g_app;
        let assisters = this.__origAi_getRefreshers(targetGroup);
        for (let unit of assisters) {
            unit.actionContext.clear();
        }

        for (let assistUnit of assisters) {
            self.__setBestTargetAndTiles(
                assistUnit,
                true,
                (targetUnit, tile) => self.__canBeActivatedPrecombatAssist(assistUnit, targetUnit, tile),
                tile => !(tile.obj instanceof TrapBase)
            );
            if (assistUnit.actionContext.bestTargetToAssist == null) {
                self.writeDebugLogLine(assistUnit.getNameWithGroup() + "の補助可能な味方がいない");
                continue;
            }

            let bestTargetToAssist = assistUnit.actionContext.bestTargetToAssist;
            let bestTileToAssist = assistUnit.actionContext.bestTileToAssist;

            self.__enqueueSupportCommand(assistUnit, bestTileToAssist, bestTargetToAssist);
            return true;
        }

        return false;
    }

    /**
     * @returns {Unit[]}
     */
    __origAi_getAttackers(targetGroup) {
        let self = g_app;
        let isAttacker = x =>
            x.groupId === targetGroup &&
            !x.isActionDone &&
            x.supportInfo.assistType !== AssistType.Refresh &&
            x.support !== Support.Smite;
        return Array.from(self.enumerateAllUnitsOnMap(isAttacker));
    }

    __origAi_simulateAttackerAction(targetGroup, enemyUnits) {
        let attackers = this.__origAi_getAttackers(targetGroup);
        this.__origAi_simulateAttackerActionImpl(attackers, enemyUnits);
    }
    __origAi_simulateAttackerActionImpl(attackers, enemyUnits) {
        let self = g_app;
        for (let unit of attackers) {
            unit.actionContext.clear();
        }

        for (let unit of attackers) {
            self.__setAttackableUnitInfo(unit, enemyUnits, tile => !(tile.obj instanceof TrapBase));
            unit.actionContext.attackableTiles = [];
            for (let attackTargetInfo of unit.actionContext.attackableUnitInfos) {
                for (let tile of attackTargetInfo.tiles) {
                    if (unit.actionContext.attackableTiles.includes(tile)) {
                        continue;
                    }
                    unit.actionContext.attackableTiles.push(tile);
                }
            }
        }
        attackers.sort(function (a, b) {
            return a.actionContext.attackableTiles.length - b.actionContext.attackableTiles.length;
        });

        this.__origAi_simulateAttackerActionImplImpl(attackers);
    }

    __origAi_simulateAttackerActionImplImpl(attackers) {
        let self = g_app;
        for (let unit of attackers) {
            if (unit.isActionDone) {
                continue;
            }

            if (unit.actionContext.attackableUnitInfos.length == 0) {
                continue;
            }

            self.__setBestTileToAttack(unit, tile => {
                return tile.obj instanceof TrapBase;
            });

            unit.actionContext.attackableUnitInfos.sort(function (a, b) {
                let restHpA = unit.hp;
                if (a.targetUnit.hasWeapon) {
                    let resultA = self.calcDamage(a.targetUnit, unit);
                    restHpA = unit.restHp;
                }
                let restHpB = unit.hp;
                if (a.targetUnit.hasWeapon) {
                    let resultB = self.calcDamage(b.targetUnit, unit);
                    restHpB = unit.restHp;
                }
                return restHpA - restHpB;
            });

            for (let attackTargetInfo of unit.actionContext.attackableUnitInfos) {
                let attackTile = attackTargetInfo.bestTileToAttack;
                self.__enqueueAttackCommand(unit, attackTargetInfo.targetUnit, attackTile);
                break;
            }

            if (self.commandQueuePerAction.length == 0) {
                continue;
            }

            return true;
        }
        return false;
    }

    __origAi_simulate2() {
        let self = g_app;
        let isAllUnitActionDone = this.__origAi_simulate();
        if (isAllUnitActionDone) {
            self.__enqueueEndAllUnitActionCommand(UnitGroupType.Ally);
        }
        self.__executeAllCommands(self.commandQueuePerAction, 0);
        updateAllUi();
    }

    __origAi_simulate3() {
        let self = g_app;
        let tiles = [];
        for (let st of self.map.enumerateBreakableStructures(UnitGroupType.Ally)) {
            tiles.push(st.placedTile);
        }
        let isActionExecuted = this.__origAi_simulatePreparationAction(tiles, []);
        self.__executeAllCommands(self.commandQueuePerAction, 0);
        updateAllUi();
    }

    // 初撃までの準備行動をシミュレート
    __origAi_simulatePreparationAction(tilesToNeedToBreakObj, targetPlacementPattern) {
        let self = g_app;
        let isActionExecuted = this.__origAi_simulateBreakStructure(tilesToNeedToBreakObj);
        if (isActionExecuted) {
            // continue;
            return false;
        }

        for (let snapshot of targetPlacementPattern) {
            let tile = self.map.getTile(snapshot.posX, snapshot.posY);
        }
        return true;
    }

    __origAi_simulateBreakStructure(tilesToNeedToBreakObj) {
        let self = g_app;
        let targetGroup = UnitGroupType.Ally;

        let structureBreakers = [];
        for (let unit of self.enumerateAllUnitsOnMap(x =>
            x.groupId == targetGroup
            && !x.isActionDone
            && x.hasWeapon)
        ) {
            unit.actionContext.clear();
            structureBreakers.push(unit);
        }

        for (let blockTile of tilesToNeedToBreakObj) {
            for (let unit of self.__enumerateUnitsSortedByNearestDistanceToTile(blockTile, structureBreakers)) {
                let movableTiles = self.__getMovableTiles(unit);
                let attackableTiles = [];
                for (let tile of self.map.enumerateAttackableTiles(unit, blockTile)) {
                    if (!movableTiles.includes(tile)) {
                        continue;
                    }
                    if (tile.getEnemyThreatFor(unit.groupId) > 0) {
                        // 敵の攻撃範囲は除外
                        continue;
                    }

                    attackableTiles.push(tile);
                }

                if (attackableTiles.length === 0) {
                    continue;
                }

                let moveTile = attackableTiles[0];
                // ブロック破壊
                if (blockTile.hasEnemyBreakableDivineVein(unit.groupId)) {
                    g_app.__enqueueBreakDivineVeinCommand(unit, moveTile, blockTile);
                } else {
                    g_app.__enqueueBreakStructureCommand(unit, moveTile, blockTile);
                }
                return true;
            }
        }

        return false;
    }

    examinesAttackableEnemies() {
        let self = this;
        let currentTurn = g_appData.currentTurn;

        // 元の状態を保存
        let serializedTurn = exportPerTurnSettingAsString();

        // 施設を除外
        self.removeDefenceStructuresNoEffectForEnemyMovement();

        // 施設を除外した状態で一旦保存
        self.tempSerializedTurn = exportPerTurnSettingAsString();

        let targetUnits = [];
        for (let unit of this.__origAi_enumerateAttackersAndRefreshers(UnitGroupType.Ally)) {
            targetUnits.push(unit);
        }
        for (let unit of self.enumerateAllUnitsOnMap(x => x.groupId == UnitGroupType.Ally)) {
            // moveUnitToTrashBox(unit);
            self.map.removeUnit(unit);
        }

        let patterns = [];
        self.__placeUnitToPlaceableSafeTilesNextToThreatenedTiles(targetUnits, () => {
            self.writeDebugLogLine("----");
            let pattern = [];
            for (let unit of self.enumerateAllUnitsOnMap(x => x.groupId == UnitGroupType.Ally)) {
                self.writeDebugLogLine(`${unit.getNameWithGroup()}: ${unit.placedTile.positionToString()}`);

                let snapshot = new Unit(unit.id);
                snapshot.posX = unit.posX;
                snapshot.posY = unit.posY;
                pattern.push(snapshot);
            }
            patterns.push(pattern);
            self.writeDebugLogLine("----");
        });

        let i = self.currentPatternIndex;
        ++self.currentPatternIndex;
        self.currentPatternIndex = self.currentPatternIndex % patterns.length;
        let alivePattern = null;
        for (let i = 0; i < patterns.length; ++i) {

            g_appData.globalBattleContext.currentTurn = currentTurn;
            importPerTurnSetting(self.tempSerializedTurn);

            self.commandQueuePerAction.clear();
            self.clearAllLogs();

            let pattern = patterns[i];
            for (let snapshot of pattern) {
                let unit = self.findUnitById(snapshot.id);
                self.map.placeUnitForcibly(unit, snapshot.posX, snapshot.posY);
            }

            while (self.vm.globalBattleContext.currentPhaseType == UnitGroupType.Ally) {
                let isAllUnitActionDone = this.__origAi_simulate();
                if (isAllUnitActionDone) {
                    self.__enqueueEndAllUnitActionCommand(UnitGroupType.Ally);
                }
                self.__executeAllCommands(self.commandQueuePerAction, 0);
            }

            while (self.vm.globalBattleContext.currentPhaseType == UnitGroupType.Enemy) {
                let isAllUnitActionDone = self.__simulateEnemyAction();
                if (isAllUnitActionDone) {
                    self.__enqueueEndAllUnitActionCommand(UnitGroupType.Enemy);
                }
                self.__executeAllCommands(self.commandQueuePerAction, 0);
                if (!self.__areAllAlliesAlive()) {
                    break;
                }
            }

            if (self.__areAllAlliesAlive()) {
                alivePattern = pattern;
                break;
            }
        }

        if (alivePattern == null) {
            importPerTurnSetting(self.serializedTurn);
            self.writeSimpleLogLine("生存パターンが見つかりませんでした");
        }
        else {
            self.writeSimpleLogLine("生存パターンが見つかりました");
            // 味方の配置状態までUndo
            while (self.commandQueuePerAction.isUndoable) {
                self.commandQueuePerAction.undo();
            }

            importPerTurnSetting(serializedTurn);

            let usedTiles = [];
            for (let snapshot of alivePattern) {
                let tile = self.map.getTile(snapshot.posX, snapshot.posY);
                usedTiles.push(tile);

                let unit = self.findUnitById(snapshot.id);
                self.map.placeUnitForcibly(unit, snapshot.posX, snapshot.posY);

                if (tile.obj != null) {
                    moveStructureToTrashBox(tile.obj);
                }
            }

            let redoStackData = self.commandQueuePerAction.redoStack.data;
            for (let i = redoStackData.length - 1; i >= 0; --i) {
                let command = redoStackData[i];
                if (!command.label.startsWith("移動")) {
                    continue;
                }

                let tileToMove = command.metaData.tileToMove;
                if (tileToMove.obj != null) {
                    moveStructureToTrashBox(tileToMove.obj);
                }

                let moveUnit = command.metaData.unit;
                usedTiles.push(tileToMove);

                {
                    let dist = tileToMove.calculateUnitMovementCountToThisTile(moveUnit, moveUnit.placedTile, moveUnit.moveCount);
                    if (dist != CanNotReachTile) {
                        continue;
                    }
                }

                // 破壊する施設候補を列挙
                let minX = Math.min(tileToMove.posX, moveUnit.placedTile.posX);
                let maxX = Math.max(tileToMove.posX, moveUnit.placedTile.posX);
                let minY = Math.min(tileToMove.posY, moveUnit.placedTile.posY);
                let maxY = Math.max(tileToMove.posY, moveUnit.placedTile.posY);
                for (let tile of self.map.enumerateTiles(x =>
                    minX <= x.posX && x.posX <= maxX
                    && minY <= x.posY && x.posY <= maxY)
                ) {
                    if (tile.obj == null) {
                        continue;
                    }

                    usedTiles.push(tile);
                    moveStructureToTrashBox(tile.obj);

                    let dist = tileToMove.calculateUnitMovementCountToThisTile(moveUnit, moveUnit.placedTile, moveUnit.moveCount);
                    if (dist != CanNotReachTile) {
                        break;
                    }
                }

                self.map.placeUnitForcibly(moveUnit, tileToMove.posX, tileToMove.posY);
            }

            importPerTurnSetting(serializedTurn);

            self.writeDebugLogLine("初撃で利用するマス-----");
            let tilesToNeedToBreakObj = [];
            for (let tile of usedTiles) {
                if (tile.obj != null) {
                    self.writeDebugLogLine(tile.positionToString() + "(施設あり)");
                    tilesToNeedToBreakObj.push(tile);
                    moveStructureToTrashBox(tile.obj);
                }
                else {
                    self.writeDebugLogLine(tile.positionToString());
                }
            }

            this.__origAi_simulatePreparationAction(tilesToNeedToBreakObj, alivePattern);
        }

        updateAllUi();
        return true;
        // startProgressiveProcess(patterns.length,
        //     function (iter) {
        //         let pattern = patterns[iter];
        //         for (let snapshot of pattern) {
        //             let unit = self.findUnitById(snapshot.id);
        //             self.map.placeUnitForcibly(unit, snapshot.posX, snapshot.posY);
        //         }
        //     },
        //     function (iter, iterMax) {
        //         $("#progress").progressbar({
        //             value: iter,
        //             max: iterMax,
        //         });
        //         updateAllUi();
        //     },
        //     function () {
        //         $("#progress").progressbar({ disabled: true });
        //         updateAllUi();
        //     },
        //     300
        // );

        // // for (let tile of self.map.enumerateSafeTilesNextToThreatenedTiles(UnitGroupType.Ally)) {
        // //     self.writeSimpleLogLine(tile.positionToString());
        // // }
        // return true;

        // {
        //     let targetGroup = UnitGroupType.Ally;
        //     let enemyGroup = UnitGroupType.Enemy;
        //     if (self.vm.globalBattleContext.currentPhaseType == enemyGroup) {
        //         return false;
        //     }

        //     let enemyUnits = self.__getUnits(unit =>
        //         unit.isOnMap
        //         && unit.groupId == enemyGroup);

        //     // self.tempSerializedTurn = exportPerTurnSettingAsString();

        //     // let currentTurn = g_appData.currentTurn;
        //     // self.isTurnWideCommandQueueEnabled = true;
        //     // for (let i = 0; i < 100; ++i) {
        //     let isActionExecuted = this.__origAi_simulateAttackerAction(targetGroup, enemyUnits);
        //     if (isActionExecuted) {
        //         // continue;
        //         return true;
        //     }

        //     isActionExecuted = this.__origAi_simulateRefreshAction(targetGroup);
        //     if (isActionExecuted) {
        //         // continue;
        //         return true;
        //     }

        //     isActionExecuted = this.__origAi_simulateSmiteAction(targetGroup);
        //     if (isActionExecuted) {
        //         // continue;
        //         return true;
        //     }

        //     // break;
        //     // }
        //     // self.isTurnWideCommandQueueEnabled = false;

        //     // g_appData.globalBattleContext.currentTurn = currentTurn;
        //     // importPerTurnSetting(self.tempSerializedTurn);
        //     // self.__executeAllCommands(self.commandQueue, 100);
        // }
        // return false;
    }
}
